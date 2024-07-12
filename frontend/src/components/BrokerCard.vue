<script lang="ts" setup>
import { Broker } from "@/models/broker";
import { Stock } from "@/models/stock";
import { onMounted, ref } from "vue";

const stocks  = ref<Stock[]>([]);

const props = defineProps<{
  broker: Broker,
  stocks: Stock[]
}>()

const stockChangeCoef = (stock) => {
  const findedStock = props.stocks.filter(propsStock => propsStock.symbol === stock.symbol)[0] as Stock;
  const lastPrice = +findedStock.months[findedStock.months.length - 1].price;
  const stockCostWithCurrentAmount = +(lastPrice * stock.amount).toFixed(2)
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
</script>

<template>
  <v-card variant="tonal" style="border-radius: 3px; width: 60%; margin-left: 20%">
    <v-card-text >
      <v-row style="display: flex; justify-content: space-between; margin-bottom: 15px">
        <v-card-title>
          {{broker.name}}
        </v-card-title>
        <div style="display: flex; flex-direction: column">
          <span>Текущий баланс:</span>
          <span>{{broker.initialValue.toFixed(2)}}</span>
        </div>
      </v-row>

      <v-row style="border-width: 1px; border-radius: 2px">
        <v-col cols="4" v-for="stock in broker.ownedStocks" style="display: flex; flex-direction: column; justify-content: center; align-items: center">
          <span>{{stock.symbol}} {{stock.amount}} шт.</span>
          <span>Потрачено: {{stock.spendMoney}}</span>
          <span style="text-align: center">По текущему курсу: {{stockChangeCoef(stock).currentPrice.toFixed(2)}}</span>
          <span :id="stock.symbol + 'percentage'" :style="{color: stockChangeCoef(stock).color}">{{stockChangeCoef(stock).percentage.toFixed(2)}} %</span>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style scoped>

</style>