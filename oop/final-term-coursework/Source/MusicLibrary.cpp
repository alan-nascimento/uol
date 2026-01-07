/*
  ==============================================================================

    MusicLibrary.cpp
    Created: 2024
    Author:  Alan Nascimento

  ==============================================================================
*/

#include "../JuceLibraryCode/JuceHeader.h"
#include "MusicLibrary.h"

//==============================================================================
MusicLibrary::MusicLibrary()
{
    setupUI();

    // Set up the library data file in user's documents folder
    File documentsDir = File::getSpecialLocation(File::userDocumentsDirectory);
    libraryDataFile = documentsDir.getChildFile("OtoDecksLibrary.txt");

    // Load existing library on startup
    loadLibraryFromFile();
}

MusicLibrary::~MusicLibrary()
{
    // Save library when component is destroyed
    saveLibraryToFile();
}

void MusicLibrary::setupUI()
{
    addAndMakeVisible(titleLabel);
    addAndMakeVisible(libraryListBox);
    addAndMakeVisible(addButton);
    addAndMakeVisible(removeButton);
    addAndMakeVisible(clearButton);

    // Set up the list box
    libraryListBox.setModel(this);
    libraryListBox.setRowHeight(25);

    // Add listeners
    addButton.addListener(this);
    removeButton.addListener(this);
    clearButton.addListener(this);

    // Style the title
    titleLabel.setJustificationType(Justification::centred);
    titleLabel.setFont(Font(18.0f, Font::bold));
    titleLabel.setColour(Label::textColourId, Colours::white);
}

void MusicLibrary::paint(Graphics& g)
{
    // Custom background with gradient
    g.setGradientFill(ColourGradient(
        Colour(0xFF2C3E50), 0.0f, 0.0f,
        Colour(0xFF34495E), getWidth(), getHeight(), false));
    g.fillAll();

    // Draw border
    g.setColour(Colours::white);
    g.drawRect(getLocalBounds(), 2);
}

void MusicLibrary::resized()
{
    auto bounds = getLocalBounds().reduced(8);

    // Title at the top
    titleLabel.setBounds(bounds.removeFromTop(30));
    bounds.removeFromTop(8);

    // Buttons at the bottom with better spacing
    auto buttonArea = bounds.removeFromBottom(45);
    int buttonWidth = (buttonArea.getWidth() - 20) / 3; // Leave space between buttons

    addButton.setBounds(buttonArea.removeFromLeft(buttonWidth).reduced(3));
    buttonArea.removeFromLeft(10); // Spacing between buttons
    removeButton.setBounds(buttonArea.removeFromLeft(buttonWidth).reduced(3));
    buttonArea.removeFromLeft(10); // Spacing between buttons
    clearButton.setBounds(buttonArea.reduced(3));

    // List box takes the remaining space
    bounds.removeFromBottom(8);
    libraryListBox.setBounds(bounds);
}

void MusicLibrary::buttonClicked(Button* button)
{
    if (button == &addButton)
    {
        auto fileChooserFlags = FileBrowserComponent::canSelectFiles;
        FileChooser chooser("Select audio files...", File::getSpecialLocation(File::userMusicDirectory));

        chooser.launchAsync(fileChooserFlags, [this](const FileChooser& chooser)
        {
            File chosenFile = chooser.getResult();
            if (chosenFile.exists() && isValidAudioFile(chosenFile))
            {
                addFileToLibrary(chosenFile);
                updateListBox();
            }
        });
    }
    else if (button == &removeButton)
    {
        int selectedRow = libraryListBox.getSelectedRow();
        if (selectedRow >= 0 && selectedRow < libraryFiles.size())
        {
            removeFileFromLibrary(selectedRow);
            updateListBox();
        }
    }
    else if (button == &clearButton)
    {
        clearLibrary();
        updateListBox();
    }
}

int MusicLibrary::getNumRows()
{
    return libraryFiles.size();
}

void MusicLibrary::paintListBoxItem(int rowNumber, Graphics& g, int width, int height, bool rowIsSelected)
{
    if (rowNumber < libraryFiles.size())
    {
        // Background
        if (rowIsSelected)
        {
            g.setColour(Colour(0xFF3498DB));
            g.fillRect(0, 0, width, height);
        }
        else
        {
            g.setColour(Colour(0xFF2C3E50));
            g.fillRect(0, 0, width, height);
        }

        // Text
        g.setColour(Colours::white);
        g.setFont(14.0f);

        String displayName = getFileDisplayName(libraryFiles[rowNumber]);
        g.drawText(displayName, 10, 0, width - 20, height, Justification::centredLeft);
    }
}

void MusicLibrary::listBoxItemClicked(int row, const MouseEvent& event)
{
    if (row >= 0 && row < libraryFiles.size() && onTrackSelected)
    {
        onTrackSelected(libraryFiles[row]);
    }
}

bool MusicLibrary::isInterestedInFileDrag(const StringArray& files)
{
    for (auto& filePath : files)
    {
        File file(filePath);
        if (isValidAudioFile(file))
            return true;
    }
    return false;
}

void MusicLibrary::filesDropped(const StringArray& files, int x, int y)
{
    for (auto& filePath : files)
    {
        File file(filePath);
        if (isValidAudioFile(file))
        {
            addFileToLibrary(file);
        }
    }
    updateListBox();
}

void MusicLibrary::addFileToLibrary(const File& file)
{
    // Check if file already exists in library
    for (auto& existingFile : libraryFiles)
    {
        if (existingFile == file)
            return;
    }

    libraryFiles.push_back(file);
    saveLibraryToFile();
}

void MusicLibrary::removeFileFromLibrary(int index)
{
    if (index >= 0 && index < libraryFiles.size())
    {
        libraryFiles.erase(libraryFiles.begin() + index);
        saveLibraryToFile();
    }
}

void MusicLibrary::clearLibrary()
{
    libraryFiles.clear();
    saveLibraryToFile();
}

File MusicLibrary::getFileAtIndex(int index)
{
    if (index >= 0 && index < libraryFiles.size())
    {
        return libraryFiles[index];
    }
    return File();
}

String MusicLibrary::getFileNameAtIndex(int index)
{
    if (index >= 0 && index < libraryFiles.size())
    {
        return libraryFiles[index].getFileName();
    }
    return String();
}

void MusicLibrary::saveLibraryToFile()
{
    if (libraryDataFile.existsAsFile())
    {
        libraryDataFile.deleteFile();
    }

    FileOutputStream stream(libraryDataFile);
    if (stream.openedOk())
    {
        for (auto& file : libraryFiles)
        {
            stream.writeString(file.getFullPathName() + "\n");
        }
    }
}

void MusicLibrary::loadLibraryFromFile()
{
    if (libraryDataFile.existsAsFile())
    {
        libraryFiles.clear();
        StringArray lines;
        libraryDataFile.readLines(lines);

        for (auto& line : lines)
        {
            File file(line);
            if (file.existsAsFile() && isValidAudioFile(file))
            {
                libraryFiles.push_back(file);
            }
        }
    }
}

void MusicLibrary::updateListBox()
{
    libraryListBox.updateContent();
    libraryListBox.repaint();
}

bool MusicLibrary::isValidAudioFile(const File& file)
{
    String extension = file.getFileExtension().toLowerCase();
    return extension == ".mp3" || extension == ".wav" || extension == ".flac" ||
           extension == ".aiff" || extension == ".ogg" || extension == ".m4a";
}

String MusicLibrary::getFileDisplayName(const File& file)
{
    if (!file.existsAsFile())
        return "Invalid File";

    String fileName = file.getFileNameWithoutExtension();
    if (fileName.isEmpty())
        fileName = "Unknown Track";

    if (fileName.length() > 40)
    {
        fileName = fileName.substring(0, 37) + "...";
    }
    return fileName;
}
