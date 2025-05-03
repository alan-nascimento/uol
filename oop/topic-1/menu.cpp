#include <iostream>
using namespace std;

void printMenu()
{
    cout << "1: Print help" << endl;
    cout << "2: Print exchange stats." << endl;
    cout << "3: Make an offer." << endl;
    cout << "4: Make a bid." << endl;
    cout << "5: Print wallet." << endl;
    cout << "6: Continue..." << endl;

    cout << "==============" << endl;
    cout << "Type in 1-6" << endl;
}

void printHelp()
{
    cout << "Help" << endl;
}

void printExchangeStats()
{
    cout << "Exchange stats" << endl;
}

void printOffer()
{
    cout << "Make an offer" << endl;
}

void printBid()
{
    cout << "Make a bid" << endl;
}

void printWallet()
{
    cout << "Print wallet" << endl;
}

void continueProgram()
{
    cout << "Continue" << endl;
}

int getUserOption()
{
    int userOption;
    cin >> userOption;
    cout << "You chose: " << userOption << endl;
    return userOption;
}

int processUserOption(int userOption)
{
    switch (userOption)
    {
    case 1:
        printHelp();
        break;
    case 2:
        printExchangeStats();
        break;
    case 3:
        printOffer();
        break;
    case 4:
        printBid();
        break;
    case 5:
        printWallet();
        break;
    case 6:
        continueProgram();
        break;
    default:
        cout << "Invalid option" << endl;
    }
    return 0;
}

int main()
{
    while (true)
    {
        printMenu();
        int userOption = getUserOption();
        processUserOption(userOption);
    }
    return 0;
}
