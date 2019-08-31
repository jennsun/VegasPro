/** 
 * Program: FadeEventInOut.js
 * Description: This script will add a 1 second fade both ends of the current event
 * Author: Johnny (Roy) Rofrano john_rofrano@hotmail.com
 * 
 * Revision Date: June 7, 2003 
 **/ 

import Sony.Vegas; 
import System.Windows.Forms;
import Microsoft.Win32;

try
{
	var evnt = FindSelectedEvent();
	if (evnt == null)
	{
		throw "Error: You must select an Event.";
	}
	evnt.FadeIn.Length = new Timecode(1000);
	evnt.FadeOut.Length = new Timecode(1000);
}
catch (errorMsg)
{
	MessageBox.Show(errorMsg, "Error", MessageBoxButtons.OK, MessageBoxIcon.Exclamation);
}

/**
 * Finds the currently selected event. Searches all tracks and returns the first
 * even that is selected or null if no event is selected
 * (Taken from the Sony.MediaSoftware Scripting FAQ)
 */
function FindSelectedEvent() : TrackEvent 
{
    var trackEnum = new Enumerator(Vegas.Project.Tracks);
    while (!trackEnum.atEnd()) 
    {
        var track : Track = Track(trackEnum.item());
        var eventEnum = new Enumerator(track.Events);
        while (!eventEnum.atEnd()) 
        {
            var evnt : TrackEvent = TrackEvent(eventEnum.item());
            if (evnt.Selected) 
            {
                return evnt;
            }
            eventEnum.moveNext();
        }
        trackEnum.moveNext();
    }
    return null;
}
