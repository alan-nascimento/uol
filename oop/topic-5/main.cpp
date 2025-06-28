#include "Wallet.h"
#include <iostream>

int main()
{
    Wallet w;

    // --- Test insertCurrency ---
    std::cout << "Inserting 1.5 BTC and 100 USD\n";
    w.insertCurrency("BTC", 1.5);
    w.insertCurrency("USD", 100);
    std::cout << w << std::endl;

    // --- Test containsCurrency ---
    std::cout << "Contains 1.0 BTC? "
              << (w.containsCurrency("BTC", 1.0) ? "yes" : "no") << "\n";
    std::cout << "Contains 2.0 BTC? "
              << (w.containsCurrency("BTC", 2.0) ? "yes" : "no") << "\n\n";

    // --- Test removeCurrency ---
    std::cout << "Attempt to remove 2.0 BTC (should fail): "
              << (w.removeCurrency("BTC", 2.0) ? "success" : "failure") << "\n";
    std::cout << w << "\n";
    std::cout << "Removing 1.0 BTC (should succeed): "
              << (w.removeCurrency("BTC", 1.0) ? "success" : "failure") << "\n";
    std::cout << w << "\n";

    // --- Test exception handling ---
    try
    {
        w.insertCurrency("EUR", -5);
    }
    catch (const std::exception &e)
    {
        std::cout << "Caught exception in insertCurrency: " << e.what() << "\n";
    }
    try
    {
        w.containsCurrency("USD", -10);
    }
    catch (const std::exception &e)
    {
        std::cout << "Caught exception in containsCurrency: " << e.what() << "\n";
    }
    try
    {
        w.removeCurrency("USD", -20);
    }
    catch (const std::exception &e)
    {
        std::cout << "Caught exception in removeCurrency: " << e.what() << "\n";
    }

    return 0;
}
