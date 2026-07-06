const LOAD_LIMIT_MS = 5000;
const REQUEST_LIMIT_MS = 4200;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const regions = {
  uk: { name: 'UK', wb: 'GBR', color: '#ef4444' },
  us: { name: 'US', wb: 'USA', color: '#3b82f6' },
  eu: { name: 'Euro Area', wb: 'EMU', color: '#22c55e' },
  china: { name: 'China', wb: 'CHN', color: '#f59e0b' }
};

const indicators = {
  inflation: {
    title: 'Inflation',
    group: 'core',
    unit: '%',
    description: 'Consumer price inflation, using monthly data where available.',
    wb: 'FP.CPI.TOTL.ZG'
  },
  gdp: {
    title: 'GDP Growth',
    group: 'core',
    unit: '%',
    description: 'Real GDP growth, using quarterly data where available.',
    wb: 'NY.GDP.MKTP.KD.ZG'
  },
  unemployment: {
    title: 'Unemployment',
    group: 'core',
    unit: '%',
    description: 'Unemployment as a share of the labour force.',
    wb: 'SL.UEM.TOTL.ZS'
  },
  rates: {
    title: 'Interest Rates',
    group: 'core',
    unit: '%',
    description: 'Policy or short-term market interest rates.'
  },
  fx: {
    title: 'FX Rates',
    group: 'financial',
    unit: 'LCU/USD',
    description: 'Local currency units per US dollar.',
    wb: 'PA.NUS.FCRF'
  },
  money: {
    title: 'Money Supply',
    group: 'financial',
    unit: '% GDP',
    description: 'Broad money as a share of GDP.',
    wb: 'FM.LBL.BMNY.GD.ZS'
  },
  currentAccount: {
    title: 'Current Account',
    group: 'external',
    unit: '% GDP',
    description: 'Current account balance as a share of GDP.',
    wb: 'BN.CAB.XOKA.GD.ZS'
  },
  trade: {
    title: 'Trade Balance / Openness',
    group: 'external',
    unit: '% GDP',
    description: 'Exports plus imports as a share of GDP.',
    wb: 'NE.TRD.GNFS.ZS'
  },
  debt: {
    title: 'Government Debt to GDP',
    group: 'external',
    unit: '% GDP',
    description: 'Government debt as a share of GDP where available.',
    wb: 'GC.DOD.TOTL.GD.ZS'
  },
  businessConfidence: {
    title: 'Business Confidence',
    group: 'confidence',
    unit: 'index',
    description: 'Business sentiment index.'
  },
  consumerConfidence: {
    title: 'Consumer Confidence',
    group: 'confidence',
    unit: 'index',
    description: 'Consumer sentiment index.'
  },
  housePrices: {
    title: 'House Prices',
    group: 'confidence',
    unit: 'index',
    description: 'House price index.'
  }
};

const liveSeries = {
  inflation: {
    uk: { type: 'ons', dataset: 'mm23', series: 'd7bt', transform: 'yoy', label: 'ONS CPI' },
    us: { type: 'fred', series: 'CPIAUCSL', transform: 'yoy', label: 'FRED/BLS CPI' },
    eu: { type: 'fred', series: 'CP0000EZ19M086NEST', transform: 'yoy', label: 'FRED/Eurostat HICP' },
    china: { type: 'fred', series: 'CHNCPIALLMINMEI', transform: 'yoy', label: 'FRED/OECD CPI' }
  },
  gdp: {
    uk: { type: 'fred', series: 'NAEXKP01GBQ657S', label: 'FRED/OECD real GDP' },
    us: { type: 'fred', series: 'GDPC1', transform: 'yoy', lag: 4, label: 'FRED/BEA real GDP' },
    eu: { type: 'fred', series: 'CLVMNACSCAB1GQEA19', transform: 'yoy', lag: 4, label: 'FRED/Eurostat real GDP' },
    china: { type: 'fred', series: 'NAEXKP01CNA657S', label: 'FRED/OECD real GDP' }
  },
  rates: {
    uk: { type: 'fred', series: 'IUDSOIA', collapse: 'year', label: 'FRED/BoE SONIA' },
    us: { type: 'fred', series: 'FEDFUNDS', collapse: 'year', label: 'FRED/Federal Reserve' },
    eu: { type: 'fred', series: 'ECBDFR', collapse: 'year', label: 'FRED/ECB' },
    china: { type: 'fred', series: 'IRSTCI01CNM156N', collapse: 'year', label: 'FRED/OECD' }
  }
};

const fallbackYears = [
  '2013', '2014', '2015', '2016', '2017', '2018', '2019',
  '2020', '2021', '2022', '2023', '2024', '2025'
];

const fallbackData = {
  inflation: {
    uk: [2.6, 1.5, 0.0, 0.7, 2.7, 2.5, 1.8, 0.9, 2.6, 9.1, 7.3, 2.5, 3.4],
    us: [1.5, 1.6, 0.1, 1.3, 2.1, 2.4, 1.8, 1.2, 4.7, 8.0, 4.1, 3.0, 2.9],
    eu: [1.4, 0.4, 0.0, 0.2, 1.5, 1.8, 1.2, 0.3, 2.6, 8.4, 5.4, 2.4, 2.2],
    china: [2.6, 2.0, 1.4, 2.0, 1.6, 2.1, 2.9, 2.4, 0.9, 2.0, 0.2, 0.2, 0.1]
  },
  gdp: {
    uk: [1.8, 3.2, 2.6, 2.2, 2.7, 1.4, 1.6, -10.4, 8.7, 4.3, 0.4, 1.1, 1.2],
    us: [1.8, 2.5, 2.9, 1.8, 2.5, 3.0, 2.5, -2.2, 5.8, 1.9, 2.5, 2.8, 2.0],
    eu: [-0.2, 1.4, 2.0, 1.9, 2.7, 1.9, 1.6, -6.1, 6.0, 3.4, 0.4, 0.9, 1.1],
    china: [7.8, 7.4, 7.0, 6.8, 6.9, 6.7, 6.0, 2.2, 8.4, 3.0, 5.2, 5.0, 4.8]
  },
  unemployment: {
    uk: [7.6, 6.2, 5.4, 4.9, 4.4, 4.1, 3.8, 4.6, 4.5, 3.7, 4.0, 4.3, 4.5],
    us: [7.4, 6.2, 5.3, 4.9, 4.4, 3.9, 3.7, 8.1, 5.4, 3.6, 3.6, 4.0, 4.1],
    eu: [12.0, 11.6, 10.9, 10.0, 9.1, 8.2, 7.6, 7.9, 7.7, 6.7, 6.5, 6.4, 6.3],
    china: [4.1, 4.1, 4.1, 4.0, 3.9, 3.8, 4.6, 5.0, 4.6, 4.9, 5.2, 5.1, 5.1]
  },
  rates: {
    uk: [0.5, 0.5, 0.5, 0.25, 0.5, 0.75, 0.75, 0.1, 0.25, 3.5, 5.25, 4.75, 3.75],
    us: [0.25, 0.25, 0.5, 0.75, 1.5, 2.5, 1.75, 0.25, 0.25, 4.5, 5.5, 4.75, 4.25],
    eu: [0.25, 0.05, -0.2, -0.4, -0.4, -0.4, -0.5, -0.5, -0.5, 2.0, 4.0, 3.0, 2.0],
    china: [6.0, 5.6, 4.35, 4.35, 4.35, 4.35, 4.15, 3.85, 3.8, 3.65, 3.45, 3.1, 2.9]
  },
  fx: {
    uk: [0.64, 0.61, 0.65, 0.74, 0.78, 0.75, 0.78, 0.78, 0.73, 0.81, 0.80, 0.78, 0.78],
    us: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    eu: [0.75, 0.75, 0.90, 0.90, 0.89, 0.85, 0.89, 0.88, 0.85, 0.95, 0.92, 0.92, 0.92],
    china: [6.15, 6.16, 6.29, 6.64, 6.76, 6.62, 6.91, 6.90, 6.45, 6.73, 7.08, 7.12, 7.20]
  },
  money: {
    uk: [134, 132, 130, 132, 136, 140, 145, 151, 154, 146, 137, 132, 130],
    us: [72, 73, 74, 76, 78, 82, 88, 108, 113, 107, 96, 91, 90],
    eu: [99, 100, 101, 102, 104, 106, 108, 115, 119, 116, 110, 106, 105],
    china: [188, 190, 194, 197, 199, 201, 202, 211, 215, 220, 226, 232, 236]
  },
  currentAccount: {
    uk: [-4.6, -4.9, -4.7, -5.2, -3.5, -3.7, -3.0, -2.6, -2.5, -5.6, -3.3, -2.8, -2.7],
    us: [-2.1, -2.1, -2.3, -2.3, -1.9, -2.2, -2.1, -2.8, -3.5, -3.8, -3.0, -3.0, -3.1],
    eu: [2.8, 3.0, 3.2, 3.5, 3.3, 3.1, 2.2, 2.0, 2.8, -0.6, 2.4, 2.8, 2.7],
    china: [1.5, 2.1, 2.7, 1.8, 1.6, 0.4, 1.0, 1.7, 1.8, 2.2, 1.4, 1.5, 1.4]
  },
  trade: {
    uk: [60.0, 58.2, 56.7, 57.9, 60.5, 62.0, 63.5, 55.0, 57.6, 70.1, 64.3, 62.5, 61.8],
    us: [29.8, 30.0, 28.1, 26.5, 27.1, 27.5, 26.3, 23.4, 25.2, 27.0, 25.8, 24.9, 24.7],
    eu: [86.5, 88.3, 89.6, 90.5, 91.8, 92.6, 92.0, 88.0, 92.5, 104.0, 98.3, 95.0, 94.2],
    china: [45.0, 43.2, 39.9, 37.2, 37.8, 37.6, 35.7, 34.5, 37.6, 38.1, 37.0, 36.0, 35.6]
  },
  debt: {
    uk: [92.0, 103.0, 112.0, 122.0, 129.0, 139.0, 159.0, 183.8, 194.7, 138.0, 136.0, 131.1, 128.0],
    us: [96.0, 97.0, 98.0, 99.0, 100.0, 100.5, 101.0, 120.4, 126.4, 114.4, 116.7, 118.0, 119.0],
    eu: [91.0, 92.0, 90.0, 89.0, 87.0, 85.0, 83.6, 97.2, 94.9, 91.0, 88.6, 87.4, 86.5],
    china: [37.0, 39.9, 41.5, 44.2, 47.8, 50.5, 57.2, 66.8, 71.8, 77.1, 84.4, 88.3, 90.0]
  },
  businessConfidence: {
    uk: [98, 99, 100, 99, 101, 100, 99, 96, 101, 98, 95, 99, 100],
    us: [99, 100, 101, 100, 102, 101, 101, 94, 103, 99, 97, 100, 101],
    eu: [97, 98, 100, 101, 102, 101, 100, 93, 102, 97, 96, 98, 99],
    china: [101, 100, 99, 100, 101, 100, 100, 98, 101, 99, 100, 101, 100]
  },
  consumerConfidence: {
    uk: [95, 96, 97, 98, 99, 98, 96, 91, 98, 86, 88, 93, 94],
    us: [96, 97, 98, 99, 100, 99, 98, 92, 99, 91, 94, 96, 97],
    eu: [94, 95, 96, 97, 98, 97, 95, 90, 96, 84, 87, 91, 92],
    china: [99, 100, 99, 100, 101, 100, 98, 97, 99, 95, 96, 98, 98]
  },
  housePrices: {
    uk: [76, 82, 88, 94, 99, 102, 96, 100, 108, 116, 114, 118, 121],
    us: [80, 84, 88, 92, 97, 101, 95, 100, 112, 123, 128, 134, 139],
    eu: [78, 82, 86, 90, 95, 99, 96, 100, 107, 113, 112, 116, 119],
    china: [92, 95, 97, 99, 101, 102, 99, 100, 102, 100, 96, 94, 92]
  }
};

const charts = {};
let macroStore = {};
let usedLive = false;
let usedCache = false;
let usedFallback = false;

const dataStatus = document.getElementById('dataStatus');
const refreshButton = document.getElementById('refreshButton');
const regionSelect = document.getElementById('regionSelect');
const groupSelect = document.getElementById('groupSelect');
const windowSelect = document.getElementById('windowSelect');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

function selectedRegions() {
  const value = regionSelect.value;
  if (value === 'ukOnly') return ['uk'];
  if (value === 'usOnly') return ['us'];
  if (value === 'chinaOnly') return ['china'];
  if (value === 'ukus') return ['uk', 'us'];
  if (value === 'western') return ['uk', 'us', 'eu'];
  if (value === 'china') return ['china', 'uk', 'us'];
  return ['uk', 'us', 'eu', 'china'];
}

function selectedIndicators() {
  const group = groupSelect.value;
  return Object.keys(indicators).filter(key => group === 'all' || indicators[key].group === group);
}

function cacheKey(indicatorKey, regionKey) {
  return `macroscope:v6:${indicatorKey}:${regionKey}`;
}

function readCache(indicatorKey, regionKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(cacheKey(indicatorKey, regionKey)) || 'null');
    return saved && Date.now() - saved.savedAt < CACHE_TTL_MS ? saved.payload : null;
  } catch (error) {
    localStorage.removeItem(cacheKey(indicatorKey, regionKey));
    return null;
  }
}

function writeCache(indicatorKey, regionKey, payload) {
  try {
    localStorage.setItem(cacheKey(indicatorKey, regionKey), JSON.stringify({
      savedAt: Date.now(),
      payload
    }));
  } catch (error) {
    console.warn('Could not save cache', error);
  }
}

function showLoading() {
  loadingOverlay.classList.remove('is-hidden');
  loadingText.textContent = 'Checking public macroeconomic sources and cached data...';
}

function hideLoading() {
  loadingOverlay.classList.add('is-hidden');
}

function seedFallbackStore() {
  macroStore = {};
  Object.keys(indicators).forEach(indicatorKey => {
    macroStore[indicatorKey] = {};
    Object.keys(regions).forEach(regionKey => {
      macroStore[indicatorKey][regionKey] = getFallback(indicatorKey, regionKey);
    });
  });
}

function getFallback(indicatorKey, regionKey, markUsed = true) {
  const values = fallbackData[indicatorKey]?.[regionKey] || [];
  if (markUsed) usedFallback = true;
  return {
    points: fallbackYears.map((year, index) => ({
      date: year,
      year,
      value: Number(values[index])
    })).filter(point => Number.isFinite(point.value)),
    mode: 'fallback',
    sourceName: 'Fallback'
  };
}

function mergeFallbackYears(payload, indicatorKey, regionKey) {
  const mergedByYear = {};

  getFallback(indicatorKey, regionKey, false).points.forEach(point => {
    mergedByYear[point.year] = point;
  });

  payload.points.forEach(point => {
    const year = String(point.year).slice(0, 4);
    if (Number.isFinite(Number(year))) {
      mergedByYear[year] = { ...point, year };
    }
  });

  const mergedPoints = Object.values(mergedByYear).sort((a, b) => Number(a.year) - Number(b.year));
  const addedFallbackYears = mergedPoints.length > payload.points.length;

  if (addedFallbackYears) usedFallback = true;

  return {
    ...payload,
    points: mergedPoints,
    sourceName: addedFallbackYears ? `${payload.sourceName} / Fallback` : payload.sourceName
  };
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_LIMIT_MS);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

function normaliseDate(dateText) {
  const text = String(dateText);
  const onsMonth = text.match(/^(\d{4})\s+([A-Z]{3})$/i);

  if (onsMonth) {
    const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    return `${onsMonth[1]}-${months[onsMonth[2].toLowerCase()]}-01`;
  }

  return text;
}

function yearFromDate(dateText) {
  return String(normaliseDate(dateText)).slice(0, 4);
}

function parseFredCsv(text) {
  return text
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map(line => {
      const [date, rawValue] = line.split(',');
      const value = Number(rawValue);
      return Number.isFinite(value) ? { date, year: yearFromDate(date), value } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function transformYoY(points, lagOverride) {
  return points
    .map((point, index) => {
      const lag = lagOverride || 12;
      const previous = points[index - lag];
      if (!previous || !previous.value) return null;
      return {
        date: point.date,
        year: point.year,
        value: ((point.value / previous.value) - 1) * 100
      };
    })
    .filter(Boolean);
}

function latestPointPerYear(points) {
  const byYear = new Map();
  points.forEach(point => {
    if (Number.isFinite(point.value)) byYear.set(String(point.year), point);
  });
  return [...byYear.values()].sort((a, b) => Number(a.year) - Number(b.year));
}

function applySeriesOptions(points, spec) {
  let output = points;
  if (spec.transform === 'yoy') output = transformYoY(output, spec.lag);
  if (spec.collapse === 'year' || spec.transform === 'yoy') output = latestPointPerYear(output);
  return output.filter(point => Number.isFinite(point.value));
}

async function fetchFred(spec) {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(spec.series)}`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error('FRED request failed');

  const points = applySeriesOptions(parseFredCsv(await response.text()), spec);
  if (!points.length) throw new Error('No FRED data returned');

  return {
    points,
    mode: 'live',
    sourceName: spec.label
  };
}

async function fetchOns(spec) {
  const url = `https://api.ons.gov.uk/timeseries/${spec.series}/dataset/${spec.dataset}/data`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error('ONS request failed');

  const json = await response.json();
  const rows = json.months || json.quarters || json.years || [];
  const points = rows
    .map(row => {
      const value = Number(row.value);
      return Number.isFinite(value)
        ? { date: normaliseDate(row.date), year: yearFromDate(row.date), value }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));

  const output = applySeriesOptions(points, spec);
  if (!output.length) throw new Error('No ONS data returned');

  return {
    points: output,
    mode: 'live',
    sourceName: spec.label
  };
}

async function fetchWorldBank(indicatorKey, regionKey) {
  const indicator = indicators[indicatorKey];
  if (!indicator.wb) throw new Error('No World Bank series configured');

  const region = regions[regionKey];
  const url = `https://api.worldbank.org/v2/country/${region.wb}/indicator/${indicator.wb}?format=json&per_page=80`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error('World Bank request failed');

  const json = await response.json();
  const rows = Array.isArray(json[1]) ? json[1] : [];
  const points = rows
    .filter(row => row.value !== null)
    .map(row => ({
      date: String(row.date),
      year: String(row.date),
      value: Number(row.value)
    }))
    .filter(point => Number.isFinite(point.value))
    .sort((a, b) => Number(a.year) - Number(b.year));

  if (!points.length) throw new Error('No World Bank data returned');

  return {
    points,
    mode: 'live',
    sourceName: 'World Bank'
  };
}

async function fetchBestSource(indicatorKey, regionKey) {
  const cached = readCache(indicatorKey, regionKey);
  if (cached) {
    usedCache = true;
    return cached;
  }

  const liveSpec = liveSeries[indicatorKey]?.[regionKey];
  const payload = liveSpec
    ? liveSpec.type === 'ons'
      ? await fetchOns(liveSpec)
      : await fetchFred(liveSpec)
    : await fetchWorldBank(indicatorKey, regionKey);

  usedLive = true;
  const mergedPayload = mergeFallbackYears(payload, indicatorKey, regionKey);
  writeCache(indicatorKey, regionKey, mergedPayload);
  return mergedPayload;
}

async function loadData(force = false) {
  showLoading();
  usedLive = false;
  usedCache = false;
  usedFallback = false;
  seedFallbackStore();

  if (force) {
    Object.keys(indicators).forEach(indicatorKey => {
      Object.keys(regions).forEach(regionKey => localStorage.removeItem(cacheKey(indicatorKey, regionKey)));
    });
  }

  const startedAt = Date.now();
  const jobs = [];

  Object.keys(indicators).forEach(indicatorKey => {
    Object.keys(regions).forEach(regionKey => {
      jobs.push(
        fetchBestSource(indicatorKey, regionKey)
          .then(payload => {
            macroStore[indicatorKey][regionKey] = payload;
          })
          .catch(error => {
            console.warn(`${indicatorKey}/${regionKey} used fallback`, error);
          })
      );
    });
  });

  const loadingMessage = window.setTimeout(() => {
    loadingText.textContent = 'Some public sources are slow, so fallback data will fill any gaps.';
  }, 2600);

  await Promise.race([
    Promise.allSettled(jobs),
    new Promise(resolve => window.setTimeout(resolve, LOAD_LIMIT_MS))
  ]);

  window.clearTimeout(loadingMessage);

  const elapsed = Date.now() - startedAt;
  if (elapsed < 900) {
    await new Promise(resolve => window.setTimeout(resolve, 900 - elapsed));
  }

  render();
  hideLoading();

  if (usedLive) {
    dataStatus.textContent = usedCache || usedFallback
      ? 'Loaded live data with cache/fallback for gaps.'
      : 'Loaded live data.';
  } else if (usedCache) {
    dataStatus.textContent = 'Loaded from recent cache with fallback for gaps.';
  } else {
    dataStatus.textContent = 'Loaded fallback data. Refresh to retry live sources.';
  }
}

function latestPoint(points) {
  return points[points.length - 1];
}

function formatValue(value, unit) {
  if (!Number.isFinite(value)) return 'n/a';
  return `${value.toFixed(1)}${unit.startsWith('%') ? '%' : ` ${unit}`}`;
}

function yearlyValues(indicatorKey, regionKey) {
  const byYear = {};
  macroStore[indicatorKey][regionKey].points.forEach(point => {
    const year = String(point.year).slice(0, 4);
    if (Number.isFinite(point.value) && Number.isFinite(Number(year))) {
      byYear[year] = point.value;
    }
  });
  return byYear;
}

function chartYears(indicatorKey, activeRegions) {
  const years = new Set();

  activeRegions.forEach(regionKey => {
    Object.keys(yearlyValues(indicatorKey, regionKey)).forEach(year => years.add(year));
  });

  const sorted = [...years].sort((a, b) => Number(a) - Number(b));
  return sorted.slice(-Number(windowSelect.value));
}

function createStats() {
  const stats = document.getElementById('stats');
  stats.innerHTML = '';

  ['inflation', 'gdp', 'unemployment', 'rates'].forEach(indicatorKey => {
    const indicator = indicators[indicatorKey];
    const point = latestPoint(macroStore[indicatorKey].uk.points);
    const card = document.createElement('div');

    card.className = 'card';
    card.innerHTML = `
      <span>${indicator.title}</span>
      <strong>${formatValue(point?.value, indicator.unit)}</strong>
      <small>UK latest: ${point?.year || 'n/a'}</small>
    `;

    stats.appendChild(card);
  });
}

function makeDataset(indicatorKey, regionKey, years) {
  const byYear = yearlyValues(indicatorKey, regionKey);

  return {
    label: regions[regionKey].name,
    data: years.map(year => byYear[year] ?? null),
    borderColor: regions[regionKey].color,
    backgroundColor: regions[regionKey].color,
    tension: 0.25,
    spanGaps: true,
    pointRadius: 4,
    pointHoverRadius: 6
  };
}

function insightText(indicatorKey, regionKey) {
  const indicator = indicators[indicatorKey];
  const byYear = yearlyValues(indicatorKey, regionKey);
  const years = Object.keys(byYear).sort((a, b) => Number(a) - Number(b));
  const visibleYears = years.slice(-Number(windowSelect.value));
  const latest = visibleYears[visibleYears.length - 1];
  const previous = visibleYears[visibleYears.length - 2];

  if (!latest) return `${regions[regionKey].name}: no recent data available.`;

  const values = visibleYears.map(year => byYear[year]).filter(Number.isFinite);
  const change = previous ? byYear[latest] - byYear[previous] : 0;

  return `${regions[regionKey].name}: latest ${formatValue(byYear[latest], indicator.unit)} in ${latest}, ${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(1)} from the previous reading. Range in view: ${Math.min(...values).toFixed(1)} to ${Math.max(...values).toFixed(1)}.`;
}

function sourceLabel(indicatorKey, activeRegions) {
  const labels = new Set(activeRegions.map(regionKey => macroStore[indicatorKey][regionKey].sourceName));
  return [...labels].join(' / ');
}

function renderChart(indicatorKey) {
  const chartsContainer = document.getElementById('charts');
  const indicator = indicators[indicatorKey];
  const activeRegions = selectedRegions();
  const years = chartYears(indicatorKey, activeRegions);
  const article = document.createElement('article');

  article.className = 'chart-container';
  article.innerHTML = `
    <div class="chart-header">
      <div>
        <p>${indicator.group}</p>
        <h2>${indicator.title}</h2>
      </div>
      <div class="chart-actions">
        <span>${sourceLabel(indicatorKey, activeRegions)}</span>
        <a class="analysis-button" href="analysis.html?indicator=${indicatorKey}">View analysis</a>
      </div>
    </div>
    <p class="description">${indicator.description}</p>
    <div class="chart-frame">
      <canvas id="chart-${indicatorKey}"></canvas>
    </div>
    <ul>
      ${activeRegions.map(regionKey => `<li>${insightText(indicatorKey, regionKey)}</li>`).join('')}
    </ul>
  `;

  chartsContainer.appendChild(article);

  if (charts[indicatorKey]) charts[indicatorKey].destroy();

  charts[indicatorKey] = new Chart(document.getElementById(`chart-${indicatorKey}`), {
    type: 'line',
    data: {
      labels: years,
      datasets: activeRegions.map(regionKey => makeDataset(indicatorKey, regionKey, years))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1400, easing: 'easeOutQuart' },
      animations: {
        y: {
          type: 'number',
          duration: 1400,
          easing: 'easeOutQuart',
          from(context) {
            const scale = context.chart.scales.y;
            return scale ? scale.getPixelForValue(0) : 0;
          }
        }
      },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#f8fafc' } },
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label}: ${formatValue(context.raw, indicator.unit)}`
          }
        }
      },
      scales: {
        x: { ticks: { color: '#cbd5e1' }, grid: { color: '#35445a' } },
        y: { ticks: { color: '#cbd5e1' }, grid: { color: '#35445a' } }
      }
    }
  });
}

function render() {
  createStats();
  document.getElementById('charts').innerHTML = '';
  selectedIndicators().forEach(renderChart);
}

refreshButton.addEventListener('click', () => loadData(true));
regionSelect.addEventListener('change', render);
groupSelect.addEventListener('change', render);
windowSelect.addEventListener('change', render);

loadData();
