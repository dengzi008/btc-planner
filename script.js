const calcBtn = document.getElementById("calcBtn");
const suggestBtn = document.getElementById("suggestBtn");
const shareBtn = document.getElementById("shareBtn");
const dailyInput = document.getElementById("dailyInput");
const targetInput = document.getElementById("targetInput");
const currencySelect = document.getElementById("currencySelect");
const rateInfo = document.getElementById("rateInfo");
const resultMain = document.getElementById("resultMain");
const resultDetail = document.getElementById("resultDetail");
const funny = document.getElementById("funny");
const suggestionEl = document.getElementById("suggestion");
const loading = document.getElementById("loading");

const fallbackPriceUSD = 60000; // USD fallback
const fallbackRates = {
  USD: 1,
  CNY: 7.1,
  EUR: 0.92,
  JPY: 150,
  GBP: 0.79,
};

const suggestions = [
  "每天多投 10%，时间可缩短约 10%~20%。",
  "周末也投一点，复利效应更香。",
  "把咖啡钱挪 1/2 过来，离目标又近一点。",
  "坚持自动定投，少看盘，心态更稳。",
  "目标拆成里程碑：先 0.01，再 0.05，再 0.1。",
  "每月检查一次计划，微调投入，保持纪律。",
];

function setLoading(show) {
  loading.classList.toggle("hidden", !show);
}

function formatMoney(num, currency) {
  return `${currency} ${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

async function fetchPrice(currency) {
  const vs = currency.toLowerCase();
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${vs}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("api error");
    const data = await res.json();
    const price = data?.bitcoin?.[vs];
    if (!price) throw new Error("no price");
    rateInfo.textContent = `价格来源：CoinGecko · 1 BTC ≈ ${formatMoney(price, currency)}`;
    return price;
  } catch (e) {
    const fallback = fallbackPriceUSD * (fallbackRates[currency] ?? 1);
    rateInfo.textContent = `使用备用价格 · 1 BTC ≈ ${formatMoney(fallback, currency)}`;
    return fallback;
  }
}

function validateInputs() {
  const daily = parseFloat(dailyInput.value);
  const target = parseFloat(targetInput.value);
  if (Number.isNaN(daily) || daily <= 0) {
    alert("请输入有效的每日投入金额");
    return null;
  }
  if (Number.isNaN(target) || target <= 0) {
    alert("请输入有效的目标 BTC 数量");
    return null;
  }
  return { daily, target };
}

function showResult({ days, months, years, price, totalCost, daily, currency }) {
  resultMain.textContent = `按照当前速度，你需要 ${days} 天 / ${months} 月 / ${years} 年 才能囤到目标。`;

  const monthlyInvest = daily * 30;
  const yearlyInvest = daily * 365;

  resultDetail.innerHTML = `
    <div>当前 BTC 价格：<span class="text-amber-300 font-semibold">${formatMoney(price, currency)}</span></div>
    <div>目标总成本：<span class="text-emerald-300 font-semibold">${formatMoney(totalCost, currency)}</span></div>
    <div>每月投入：<span class="text-sky-300 font-semibold">${formatMoney(monthlyInvest, currency)}</span> · 每年投入：<span class="text-sky-300 font-semibold">${formatMoney(yearlyInvest, currency)}</span></div>
  `;

  if (days > 1000) {
    funny.textContent = "老铁，坚持就是胜利！";
  } else if (days < 100) {
    funny.textContent = "太猛了，马上就能实现！";
  } else {
    funny.textContent = "";
  }
}

async function calculate() {
  const values = validateInputs();
  if (!values) return;
  const { daily, target } = values;
  const currency = currencySelect.value;
  setLoading(true);
  resultMain.textContent = "";
  resultDetail.textContent = "";
  funny.textContent = "";
  suggestionEl.textContent = "";

  const price = await fetchPrice(currency);
  const totalCost = price * target;
  const daysNeeded = Math.ceil(totalCost / daily);
  const months = Math.ceil(daysNeeded / 30);
  const years = (daysNeeded / 365).toFixed(2);

  showResult({
    days: daysNeeded,
    months,
    years,
    price,
    totalCost,
    daily,
    currency,
  });

  setLoading(false);
}

function randomSuggestion() {
  const pick = suggestions[Math.floor(Math.random() * suggestions.length)];
  suggestionEl.textContent = `建议：${pick}`;
}

function share() {
  const text = resultMain.textContent || "来算算你需要多久能囤到目标 BTC！";
  const detail = resultDetail.textContent || "";
  const payload = {
    title: "囤比特币规划器",
    text: `${text}\n${detail}`,
    url: location.href,
  };
  if (navigator.share) {
    navigator.share(payload).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(`${payload.title}\n${payload.text}\n${payload.url}`);
    alert("结果已复制，去粘贴吧！");
  } else {
    alert(text);
  }
}

calcBtn.addEventListener("click", calculate);
suggestBtn.addEventListener("click", randomSuggestion);
shareBtn.addEventListener("click", share);

// 初始提示
rateInfo.textContent = "选择货币后计算会自动获取实时价格；若失败则使用备用价格。";

