/**
 * This script normalizes all Audio Events in the current project.
 * This script works best if you run it after all event peaks have
 * been built.
 *
 * Revision Date: Feb. 10, 2003
 **/

import Sony.Vegas;

var trackEnum : Enumerator = new Enumerator(Vegas.Project.Tracks);
while (!trackEnum.atEnd()) {
    var track : Track = Track(trackEnum.item());
    if (track.IsAudio()) {
        var eventEnum : Enumerator = new Enumerator(track.Events);
        while (!eventEnum.atEnd()) {
            var audioEvent : AudioEvent = AudioEvent(eventEnum.item());
            audioEvent.Normalize = true;
            eventEnum.moveNext();
        }
    }
    trackEnum.moveNext();
}

