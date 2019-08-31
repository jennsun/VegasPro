import Sony.Vegas; 
import System.Windows.Forms;
import Microsoft.Win32;

//time intervals for split events.

try
{


// step through all selected video events:
var FirstTrack : Track = Vegas.Project.Tracks.Item(0);

// step through all selected video events:
for (var track in Vegas.Project.Tracks) {
if( !track.Selected) continue;
var tracktime = new Timecode(0);
for (var evnt in track.Events) {
evnt.AdjustStartLength(tracktime,evnt.Length,true);
tracktime = tracktime + evnt.Length;
}
}
}

catch (errorMsg)
{
MessageBox.Show(errorMsg, "Error", MessageBoxButtons.OK, MessageBoxIcon.Exclamation);
}
