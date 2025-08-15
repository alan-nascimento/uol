#include "CandlestickBuilder.h"
#include <map>                                   // For grouping
#include <algorithm>                             // For sort

std::vector<Candlestick> CandlestickBuilder::build(
    const std::vector<WeatherRecord>& data,
    Period period) {
    std::map<std::string, std::vector<WeatherRecord>> groups; // Map period->records
    int len = (period == Period::YEAR)  ? 4             // YYYY
            : (period == Period::MONTH) ? 7             // YYYY-MM
            : 10;                                    // YYYY-MM-DD

    for (auto& r : data)                         // Group records
        if ((int)r.timestamp.size() >= len)
            groups[r.timestamp.substr(0, len)].push_back(r);

    std::vector<Candlestick> candles;            // Output candles
    for (auto& kv : groups) {
        auto recs = kv.second;                    // Copy group
        std::sort(recs.begin(), recs.end(),       // Sort by timestamp
                  [](const WeatherRecord& a, const WeatherRecord& b) {
                      return a.timestamp < b.timestamp;
                  });
        double open  = recs.front().temperature; // First record temp
        double close = recs.back().temperature;  // Last record temp
        double high  = open;                    // Init high
        double low   = open;                    // Init low
        for (auto& r : recs) {                  // Compute high/low
            if (r.temperature > high) high = r.temperature;
            if (r.temperature < low)  low  = r.temperature;
        }
        candles.emplace_back(kv.first, open, high, low, close); // Store
    }

    std::sort(candles.begin(), candles.end(),   // Sort candles by period
              [](const Candlestick& a, const Candlestick& b) {
                  return a.period < b.period;
              });
    return candles;                             // Return result
}
