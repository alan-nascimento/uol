#include "ASCIIPlotter.h"
#include <iostream>                             // For std::cout
#include <iomanip>                              // For std::setw

void ASCIIPlotter::plot(const std::vector<Candlestick>& candles) {
    if (candles.empty()) return;             // Nothing to plot

    double minT = candles.front().low;       // Initialize min temp
    double maxT = candles.front().high;      // Initialize max temp
    for (auto& c : candles) {                // Find global range
        if (c.low  < minT)  minT = c.low;
        if (c.high > maxT) maxT = c.high;
    }
    int width = 50;                            // Chart width

    for (auto& c : candles) {
        // Map values to positions
        int lp = (int)((c.low   - minT) / (maxT - minT) * (width - 1));
        int hp = (int)((c.high  - minT) / (maxT - minT) * (width - 1));
        int op = (int)((c.open  - minT) / (maxT - minT) * (width - 1));
        int cp = (int)((c.close - minT) / (maxT - minT) * (width - 1));
        std::string line(width, ' ');          // Line buffer

        line[lp] = '|';                        // Draw low wick
        line[hp] = '|';                        // Draw high wick
        for (int i = std::min(op, cp); i <= std::max(op, cp); ++i)
            line[i] = '#';                    // Draw body

        // Print period and ASCII chart
        std::cout << std::setw(8) << c.period << " | " << line << '\n';
    }
}
