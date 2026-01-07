/*
  ==============================================================================

    This file was auto-generated!

  ==============================================================================
*/

#include "MainComponent.h"

//==============================================================================
MainComponent::MainComponent()
{
    // Make sure you set the size of the component after
    // you add any child components.
    setSize (1400, 900);

    // Some platforms require permissions to open input channels so request that here
    if (RuntimePermissions::isRequired (RuntimePermissions::recordAudio)
        && ! RuntimePermissions::isGranted (RuntimePermissions::recordAudio))
    {
        RuntimePermissions::request (RuntimePermissions::recordAudio,
                                     [&] (bool granted) { if (granted)  setAudioChannels (2, 2); });
    }
    else
    {
        // Specify the number of input and output channels that we want to open
        setAudioChannels (0, 2);
    }

    addAndMakeVisible(deck1);
    addAndMakeVisible(deck2);
    addAndMakeVisible(musicLibrary);
    addAndMakeVisible(beatGrid);


    formatManager.registerBasicFormats();

    // Initialize with safe default values
    player1.setGain(0.5);
    player2.setGain(0.5);

    // Set up music library callbacks
    musicLibrary.onTrackSelected = [this](const File& file) {
        // Load track to deck 1 by default
        if (file.existsAsFile())
        {
            deck1.loadFile(file);
        }
    };

    // Set up beat grid callbacks
    beatGrid.onBPMChanged = [this](double bpm) {
        // Update both decks with new BPM for sync
        // This could be used for automatic BPM matching
    };
}

MainComponent::~MainComponent()
{
    // This shuts down the audio device and clears the audio source.
    shutdownAudio();
}

//==============================================================================
void MainComponent::prepareToPlay (int samplesPerBlockExpected, double sampleRate)
{
    player1.prepareToPlay(samplesPerBlockExpected, sampleRate);
    player2.prepareToPlay(samplesPerBlockExpected, sampleRate);

    mixerSource.prepareToPlay(samplesPerBlockExpected, sampleRate);

    mixerSource.addInputSource(&player1, false);
    mixerSource.addInputSource(&player2, false);

 }
void MainComponent::getNextAudioBlock (const AudioSourceChannelInfo& bufferToFill)
{
    mixerSource.getNextAudioBlock(bufferToFill);
}

void MainComponent::releaseResources()
{
    // This will be called when the audio device stops, or when it is being
    // restarted due to a setting change.

    // For more details, see the help for AudioProcessor::releaseResources()
    player1.releaseResources();
    player2.releaseResources();
    mixerSource.releaseResources();
}

//==============================================================================
void MainComponent::paint (Graphics& g)
{
    // Custom dark gradient background
    g.setGradientFill(ColourGradient(
        Colour(0xFF0F0F0F), 0.0f, 0.0f,
        Colour(0xFF1A1A1A), getWidth(), getHeight(), false));
    g.fillAll();

    // Draw application title
    g.setColour(Colours::white);
    g.setFont(Font(24.0f, Font::bold));
    g.drawText("OTO DECKS", getLocalBounds().removeFromTop(40),
               Justification::centred, true);
}

void MainComponent::resized()
{
    auto bounds = getLocalBounds();
    bounds.removeFromTop(50); // Space for title

    // Custom layout: 3-column design with better proportions
    int totalWidth = bounds.getWidth();
    int leftWidth = totalWidth * 25 / 100;    // 25% for library
    int middleWidth = totalWidth * 30 / 100;  // 30% for beat grid
    int rightWidth = totalWidth * 45 / 100;   // 45% for decks

    // Left column: Music Library
    musicLibrary.setBounds(bounds.removeFromLeft(leftWidth).reduced(3));

    // Middle column: Beat Grid
    beatGrid.setBounds(bounds.removeFromLeft(middleWidth).reduced(3));

    // Right column: Two decks stacked vertically
    auto deckArea = bounds.reduced(3);
    int deckHeight = deckArea.getHeight() / 2;

    deck1.setBounds(deckArea.removeFromTop(deckHeight));
    deck2.setBounds(deckArea);
}

