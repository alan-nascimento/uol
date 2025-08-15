#include "Candlestick.h"                       // Include header

// Define constructor using initializer list
Candlestick::Candlestick(const std::string& period,
                         double open, double high,
                         double low, double close)
    : period(period),                      // Initialize period
      open(open),                          // Initialize open
      high(high),                          // Initialize high
      low(low),                            // Initialize low
      close(close) {}                      // Initialize close
