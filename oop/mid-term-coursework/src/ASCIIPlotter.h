#ifndef ASCII_PLOTTER_H
#define ASCII_PLOTTER_H
#include <vector>
#include "Candlestick.h"

class ASCIIPlotter {
public:
    // Plot ASCII candlestick chart
    static void plot(const std::vector<Candlestick>& candles);
};
#endif // ASCII_PLOTTER_H
