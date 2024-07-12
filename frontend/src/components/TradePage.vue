<script lang="ts" setup>
import {Broker} from "@/models/broker";
import {OwnedStock} from "@/models/ownedStock";
import {Stock} from "@/models/stock";
import {TradingStock} from "@/models/tradingStock";
import {UserService} from "@/services/userService";
import websocketService from "@/services/websocketService";
import {onMounted, computed, ref} from "vue";
import Modal from "@/components/Modal.vue";
import router from '@/router/router'

const tradeDate = ref();
const stocks = ref<Stock[]>();
const tradingStocks = ref<TradingStock[]>();
const emits = defineEmits(['onBrokerBalanceChange'])

const broker = ref<Broker>({
  name: null,
  initialValue: null,
  ownedStocks: [{
    symbol: null,
    amount: null,
    spendMoney: null
  }]
});

const sellCountArray = ref<{
  symbol: string,
  count: number
}[]>([]);

const buyCountArray = ref<{
  symbol: string,
  count: number
}[]>([]);

onMounted(() => {
  websocketService.emit('getStartTradeDate');
  websocketService.emit('stocks');
  broker.value = UserService.getCreatedInstance()?.getLoginedUser();

  websocketService.on('getStartTradeDate', date => {
    tradeDate.value = date;
  });

  websocketService.on('stocks', data => {
    stocks.value = data;
    stocks.value?.forEach(stock => {
      sellCountArray.value.push({
        symbol: stock.symbol,
        count: 0
      })
    })
  })

  websocketService.emit('getTradeStock');
  websocketService.on('getTradeStock', data => {
    tradingStocks.value = data;
    tradingStocks.value?.forEach(tradingStock => {
      buyCountArray.value.push({
        symbol: tradingStock.stock.symbol,
        count: 0
      })
    })
  });

  websocketService.on('updateStockData', data => {
    stocks.value = data;
  })
})

const getStockFromSymbol = (symbol: string): Stock => {
  return stocks.value.filter(propsStock => propsStock.symbol === symbol)[0] as Stock;
}

const getLastStockPrice = (stock: Stock) => {
  return +stock.months[stock.months.length - 1].price;
}

const tradeDateStart = computed(() => {
  if (tradeDate.value === null) return 'Торговля еще не началась';

  return `Торговля началась ` + new Date(tradeDate.value).toLocaleDateString('ru')
})

const stockChangeCoef = (stock) => {
  const findedStock = getStockFromSymbol(stock.symbol);
  const lastStockPrice = getLastStockPrice(findedStock);

  const stockCostWithCurrentAmount = lastStockPrice * stock.amount;
  const stockCost = stock.spendMoney;
  let coefColor;

  const result = 100 - stockCost / stockCostWithCurrentAmount * 100;

  if (result === 0) {
    coefColor = 'gray'
  } else if (result < 0) {
    coefColor = 'red'
  } else if (result > 0) {
    coefColor = 'green'
  }

  return {
    color: coefColor,
    currentPrice: stockCostWithCurrentAmount,
    percentage: result,
  }
}

const handlePlusSellButton = (stock: OwnedStock) => {
  const currentStock = sellCountArray.value.filter(sellStock => sellStock.symbol === stock.symbol)[0];
  if (currentStock.count === stock.amount) return;

  currentStock.count += 1
}

const handleMinusSellButton = (stock: OwnedStock) => {
  const currentStock = sellCountArray.value.filter(sellStock => sellStock.symbol === stock.symbol)[0];
  if (currentStock.count === 0) return;

  currentStock.count -= 1
}

const handleSellButton = (ownedStock: OwnedStock) => {
  if (tradeDate.value === null) {
    alert('Торговля еще не началась!');
    return;
  }

  const sellStock = sellCountArray.value.filter(sellStock => sellStock.symbol === ownedStock.symbol)[0];
  const stock = getStockFromSymbol(ownedStock.symbol);
  const lastStockPrice = getLastStockPrice(stock);

  if (ownedStock.amount >= sellStock.count) {
    ownedStock.amount -= sellStock.count;
    if (ownedStock.amount === 0) {
      broker.value.ownedStocks = broker.value.ownedStocks.filter((stock) => stock.symbol !== ownedStock.symbol);
    }
  } else {
    alert('Вы хотите продать слишком много акций!');
    return;
  }

  websocketService.emit('addTradeStock', {
    stock: stock,
    amount: sellStock.count
  })

  websocketService.on('addTradeStock', data => {
    if (data !== null) {
      websocketService.emit('getTradeStock');
      websocketService.on('getTradeStock', data => {
        tradingStocks.value = data;
      });
    }
  })

  ownedStock.spendMoney -= lastStockPrice * sellStock.count;

  broker.value.initialValue += lastStockPrice * sellStock.count;

  websocketService.emit('updateBroker', broker.value);
  UserService.setInstance(broker.value);

  sellStock.count = 0;

  emits('onBrokerBalanceChange');
}

const handleLogout = () => {
  localStorage.clear();
  UserService.exit();
  router.push('/');
}

const handlePlusBuyButton = (tradingStock: TradingStock) => {
  const currentStock = buyCountArray.value.filter(sellStock => sellStock.symbol === tradingStock.stock.symbol)[0];
  if (currentStock.count >= tradingStock.amount) return;

  currentStock.count += 1
}

const handleMinusBuyButton = (tradingStock: TradingStock) => {
  const currentStock = buyCountArray.value.filter(sellStock => sellStock.symbol === tradingStock.stock.symbol)[0];
  if (currentStock.count === 0) return;

  currentStock.count -= 1
}

const handleBuyButton = (tradingStock: TradingStock) => {
  if (tradeDate.value === null) {
    alert('Торговля еще не началась!');
    return;
  }

  const currentTradeStock = buyCountArray.value.filter(sellStock => sellStock.symbol === tradingStock.stock.symbol)[0];

  const currentStock = getStockFromSymbol(currentTradeStock.symbol);
  const currentStockPrice = getLastStockPrice(currentStock);
  const spendMoney = currentStockPrice * currentTradeStock.count;

  const boughtStock: OwnedStock = {
    symbol: currentTradeStock.symbol,
    amount: currentTradeStock.count,
    spendMoney
  }

  if (spendMoney > broker.value.initialValue) {
    alert(`У вас недостаточно средств на счету! Не хватает ${spendMoney - broker.value.initialValue}`);
    return;
  }

  const newTradingStocks = [];

  tradingStocks.value?.forEach(stock => {
    if (stock.stock.symbol === tradingStock.stock.symbol) {
      if (stock.amount < currentTradeStock.count) {
        alert('Вы хотите купить больше, чем есть на складе!');
        return;
      } else {
        stock.amount -= currentTradeStock.count;

        if (stock.amount === 0) {
          websocketService.emit('removeTradeStock', stock.stock.symbol);
        } else {
          console.log(stock)
          websocketService.emit('reduceTradeStock', {
            stock: stock.stock,
            amount: currentTradeStock.count
          })

          websocketService.on('reduceTradeStock', data => {
            if (data !== null) {
              websocketService.emit('getTradeStock');
              websocketService.on('getTradeStock', data => {
                tradingStocks.value = data;
              });
            }
          })
        }
      }
    }
  });

  broker.value.initialValue -= spendMoney;

  const alreadyHasStock = broker.value.ownedStocks.filter(ownedStock => ownedStock.symbol === boughtStock.symbol).length !== 0;

  if (alreadyHasStock) {
    broker.value.ownedStocks.forEach(ownedStock => {
      if (ownedStock.symbol === boughtStock.symbol) {
        ownedStock.amount += boughtStock.amount;
        ownedStock.spendMoney += boughtStock.spendMoney;
      }
    })
  } else {
    broker.value.ownedStocks.push(boughtStock);
  }

  websocketService.emit('updateBroker', broker.value);
  UserService.setInstance(broker.value);

  emits('onBrokerBalanceChange');

  currentTradeStock.count = 0;
}

</script>

<template>
  <div style="display: flex">
    <v-btn @click="handleLogout" color="error" style="margin-left: 10px; margin-top: 10px; width: 10%">Выход</v-btn>
    <router-link to="/brokers" style="margin-left: 10px; margin-top: 10px; width: 10%">
      <v-btn id="brokers">Брокеры</v-btn>
    </router-link>
    <div style="width: 80%; text-align: right">
      <h2 style="margin: 10px">{{broker.name}}</h2>
    </div>
  </div>
  <v-container>
    <v-row>
      <h1 style="width: 50%; margin-left: 25%; text-align: center">{{ tradeDateStart }}</h1>
    </v-row>
    <v-row>
      <v-card variant="tonal" class="pa-3 rounded w-100 my-2">
        <v-card-title style="text-align: center">Покупка</v-card-title>
        <v-col v-if="tradingStocks?.length !== 0" style="display:flex;">
          <v-col cols="3" v-for="tradingStock in tradingStocks" style="display: flex; flex-direction: column; justify-content: center; align-items: center">
            <span>{{tradingStock.stock.symbol}} {{tradingStock.amount}} шт.</span>
            <span>Текущий курс: {{getLastStockPrice(getStockFromSymbol(tradingStock.stock.symbol))}}</span>

            <div class="d-flex flex-column align-center justify-center" style="margin-top: 15px">
              <v-row style="align-items: center">
                <div style="gap: 5px; display: flex; flex-direction: column">
                  <v-btn :id="tradingStock.stock.symbol + 'plusBuy'" density="compact" icon="mdi-plus" color="success" @click="handlePlusBuyButton(tradingStock)"></v-btn>
                  <v-btn :id="tradingStock.stock.symbol + 'minusBuy'" density="compact" icon="mdi-minus" color="error" @click="handleMinusBuyButton(tradingStock)"></v-btn>
                </div>
                <div style="margin-left: 5px">
                  <v-btn :id="tradingStock.stock.symbol + 'buy'" @click="handleBuyButton(tradingStock)" variant="elevated">
                    {{buyCountArray.filter(buyStock => buyStock.symbol === tradingStock.stock.symbol)[0].count}} Купить
                  </v-btn>
                </div>
              </v-row>
              <Modal :data="tradingStock.stock.symbol">
                <p>График цены</p>
              </Modal>
            </div>

          </v-col>
        </v-col>
        <v-col v-else>
          Пока никто не выложил на продажу ни одной акции...
        </v-col>
      </v-card>
    </v-row>
    <v-row>
      <v-card variant="tonal" class="pa-3 rounded w-100 my-2">
        <v-card-title style="text-align: center">Продажа</v-card-title>
        <v-row>
          <v-col v-if="broker.ownedStocks.length !== 0 && stocks" style="display: flex">
            <v-col  cols="3" v-for="stock in broker.ownedStocks" style="display: flex; flex-direction: column; justify-content: center; align-items: center">
              <span>{{stock.symbol}} {{stock.amount}} шт.</span>
              <span>Потрачено: {{stock.spendMoney.toFixed(2)}}</span>
              <span style="text-align: center">По текущему курсу: {{stockChangeCoef(stock).currentPrice.toFixed(2)}}</span>
              <span :style="{color: stockChangeCoef(stock).color}">{{stockChangeCoef(stock).percentage.toFixed(2)}} %</span>
              <div class="d-flex flex-column align-center justify-center my-2">
                <v-row style="align-items: center">
                  <div style="gap: 5px; display: flex; flex-direction: column">
                    <v-btn :id="stock.symbol + 'plusSell'" density="compact" icon="mdi-plus" color="success" @click="handlePlusSellButton(stock)"></v-btn>
                    <v-btn :id="stock.symbol + 'minusSell'" density="compact" icon="mdi-minus" color="error" @click="handleMinusSellButton(stock)"></v-btn>
                  </div>
                  <div style="margin-left: 5px">
                    <v-btn :id="stock.symbol + 'sell'" @click="handleSellButton(stock)" variant="elevated">
                      {{sellCountArray.filter(sellStock => sellStock.symbol === stock.symbol)[0].count}} Продать
                    </v-btn>
                  </div>
                </v-row>
                <Modal :data="stock.symbol">
                  <p>График цены</p>
                </Modal>
              </div>
            </v-col>
          </v-col  >
          <v-col v-else>
            У вас нет акций в портфеле...
          </v-col>
        </v-row>
      </v-card>
    </v-row>
  </v-container>
</template>

<style scoped>

</style>