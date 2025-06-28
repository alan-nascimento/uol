#pragma once
#include <string>

class StockEntry {
public:
    std::string date;
    double close;
    double high;
    double low;
    double open;
    unsigned long volume;

    StockEntry(std::string date, double close, double high, double low, double open, unsigned long volume)
        : date(date), close(close), high(high), low(low), open(open), volume(volume) {}
};
