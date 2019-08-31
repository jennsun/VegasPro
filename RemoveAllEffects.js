import System;
import System.Collections;
import System.Text;
import System.IO;
import System.Drawing;
import System.Windows.Forms;
import Sony.Vegas;

try {

  var trackEnum = new Enumerator(Vegas.Project.Tracks);
  while (!trackEnum.atEnd()) {
    var track : Track = Track(trackEnum.item());

    //Go through the list of Events
    var eventEnum = new Enumerator(track.Events);
    while (!eventEnum.atEnd()) {
      var evnt : TrackEvent = TrackEvent(eventEnum.item());

      if (evnt.Selected & evnt.IsVideo()) {
        var videoEvent = VideoEvent(evnt);
        var i;
        for (i=videoEvent.Effects.Count - 1; i >= 0; i--) {
          var effect = videoEvent.Effects[i];
          videoEvent.Effects.Remove(effect);
        }
      }

      eventEnum.moveNext();
    }

  trackEnum.moveNext();
  }


} catch (e) {
    MessageBox.Show(e);
}


