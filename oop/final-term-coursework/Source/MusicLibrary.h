/*
  ==============================================================================

    MusicLibrary.h
    Created: 2024
    Author:  Alan Nascimento

  ==============================================================================
*/

#pragma once

#include "../JuceLibraryCode/JuceHeader.h"

//==============================================================================
/*
    MusicLibrary component that manages a library of music files
    with persistence between application sessions
*/
class MusicLibrary : public Component,
                     public Button::Listener,
                     public ListBoxModel,
                     public FileDragAndDropTarget
{
public:
    MusicLibrary();
    ~MusicLibrary();

    void paint(Graphics& g) override;
    void resized() override;

    // Button::Listener implementation
    void buttonClicked(Button* button) override;

    // ListBoxModel implementation
    int getNumRows() override;
    void paintListBoxItem(int rowNumber, Graphics& g, int width, int height, bool rowIsSelected) override;
    void listBoxItemClicked(int row, const MouseEvent& event) override;

    // FileDragAndDropTarget implementation
    bool isInterestedInFileDrag(const StringArray& files) override;
    void filesDropped(const StringArray& files, int x, int y) override;

    // Library management functions
    void addFileToLibrary(const File& file);
    void removeFileFromLibrary(int index);
    void clearLibrary();
    File getFileAtIndex(int index);
    String getFileNameAtIndex(int index);

    // Persistence functions
    void saveLibraryToFile();
    void loadLibraryFromFile();

    // Signal for when a track is selected
    std::function<void(const File&)> onTrackSelected;

private:
    // UI Components
    ListBox libraryListBox;
    TextButton addButton{"ADD FILES"};
    TextButton removeButton{"REMOVE"};
    TextButton clearButton{"CLEAR ALL"};
    Label titleLabel{"Library Title", "MUSIC LIBRARY"};

    // Data
    std::vector<File> libraryFiles;
    File libraryDataFile;

    // Helper functions
    void setupUI();
    void updateListBox();
    bool isValidAudioFile(const File& file);
    String getFileDisplayName(const File& file);

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(MusicLibrary)
};

