/*
  ==============================================================================

    WaveformDisplay.cpp
    Created: 14 Mar 2020 3:50:16pm
    Author:  matthew

  ==============================================================================
*/

#include "../JuceLibraryCode/JuceHeader.h"
#include "WaveformDisplay.h"

//==============================================================================
WaveformDisplay::WaveformDisplay(AudioFormatManager & 	formatManagerToUse,
                                 AudioThumbnailCache & 	cacheToUse) :
                                 audioThumb(1000, formatManagerToUse, cacheToUse),
                                 fileLoaded(false),
                                 position(0)

{
    // In your constructor, you should add any child components, and
    // initialise any special settings that your component needs.

  audioThumb.addChangeListener(this);
}

WaveformDisplay::~WaveformDisplay()
{
}

void WaveformDisplay::paint (Graphics& g)
{
    // Modern dark background
    g.fillAll(Colour(0xFF2C2C2C));

    if(fileLoaded)
    {
        // Draw waveform
        g.setColour(Colour(0xFF3498DB));
        audioThumb.drawChannel(g,
            getLocalBounds(),
            0,
            audioThumb.getTotalLength(),
            0,
            1.0f
        );

                // Draw playhead with bounds checking
        g.setColour(Colour(0xFFE74C3C));
        int playheadX = (int)(position * getWidth());

        // Ensure playhead is within bounds
        if (playheadX >= 0 && playheadX < getWidth())
        {
            g.drawVerticalLine(playheadX, 0, getHeight());

            // Draw playhead indicator
            g.fillEllipse(playheadX - 3, getHeight() / 2 - 3, 6, 6);
        }
    }
    else
    {
        // Draw placeholder
        g.setColour(Colours::lightgrey);
        g.setFont(14.0f);
        g.drawText("No track loaded", getLocalBounds(),
                    Justification::centred, true);
    }

    // Draw border
    g.setColour(Colours::white);
    g.drawRect(getLocalBounds(), 1);
}

void WaveformDisplay::resized()
{
    // This method is where you should set the bounds of any child
    // components that your component contains..

}

void WaveformDisplay::loadURL(URL audioURL)
{
  audioThumb.clear();
  fileLoaded  = audioThumb.setSource(new URLInputSource(audioURL));
  if (fileLoaded)
  {
    std::cout << "wfd: loaded! " << std::endl;
    repaint();
  }
  else {
    std::cout << "wfd: not loaded! " << std::endl;
  }

}

void WaveformDisplay::changeListenerCallback (ChangeBroadcaster *source)
{
    std::cout << "wfd: change received! " << std::endl;

    repaint();

}

void WaveformDisplay::setPositionRelative(double pos)
{
  // Ensure position is within valid bounds
  if (pos < 0.0) pos = 0.0;
  if (pos > 1.0) pos = 1.0;

  if (pos != position)
  {
    position = pos;
    repaint();
  }
}




