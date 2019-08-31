//ChangeAlphaChannel.js by Roger Magnusson (roger_74 at home dot se)
import Sony.Vegas;

var ChangeAlphaTo : VideoAlphaType = VideoAlphaType.Premultiplied; //Set this to the type you want
/*
VideoAlphaType.Undefined
VideoAlphaType.None
VideoAlphaType.Straight
VideoAlphaType.Premultiplied
VideoAlphaType.PremultipliedDirty
*/

for (var currentTrack : Track in Vegas.Project.Tracks)
{
	if (currentTrack.IsVideo() == true)
	{
		for (var currentEvent : VideoEvent in currentTrack.Events)
		{
			if (currentEvent.Selected == true)
			{
				VideoStream(new Media(currentEvent.ActiveTake.MediaPath).Streams.GetItemByMediaType(currentEvent.MediaType, currentEvent.ActiveTake.StreamIndex)).AlphaChannel = ChangeAlphaTo;
			}
		}
	}
}