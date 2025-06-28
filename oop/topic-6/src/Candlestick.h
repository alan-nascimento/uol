#ifndef CANDLESTICK_H
#define CANDLESTICK_H
#include <string>                                   // For std::string

class Candlestick {
public:
    std::string period;                          // Label for time period
    double open;                                 // Opening temperature value
    double high;                                 // Maximum temperature
    double low;                                  // Minimum temperature
    double close;                                // Closing temperature

    // Constructor initializes all members
    Candlestick(const std::string& period,       // Period label
                double open,                     // First temp
                double high,                     // Highest temp
                double low,                      // Lowest temp
                double close);                  // Last temp
};
#endif // CANDLESTICK_H
