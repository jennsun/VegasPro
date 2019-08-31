// "Match Output Aspect" on all selected video events.
// No selection = ALL

import System.Windows.Forms;
import Sony.Vegas;

var zero : int = 0;

function GetSelectionCount (mediaType)
{
    var cTracks   = Vegas.Project.Tracks.Count;
    var cSelected = zero;
    var ii; 
    
    for (ii = zero; ii < cTracks; ii ++)
    {
        var track = Vegas.Project.Tracks[ii];
        
        if (track.MediaType == mediaType)
        {            
            var eventEnum : Enumerator = new Enumerator(track.Events);
        
            while ( ! eventEnum.atEnd() ) 
            {            
                if (eventEnum.item().Selected)
                {                
                    cSelected ++;       
                }
                
                eventEnum.moveNext();                            
            }
        }                                  
    }
    
    return cSelected; 
}

function GetActiveMediaStream (trackEvent : TrackEvent)
{
    try
    {
        if ( ! trackEvent.ActiveTake.IsValid())
        {
            throw "empty or invalid take";
        }                
        
        var media = Vegas.Project.MediaPool.Find (trackEvent.ActiveTake.MediaPath);
        
        if (null == media)
        {
            throw "missing media";
        }
        
        var mediaStream = media.Streams.GetItemByMediaType (MediaType.Video, trackEvent.ActiveTake.StreamIndex);        
        
        return mediaStream;
    }
    catch (e)
    {
        //MessageBox.Show(e);
        return null;
    }    
}

function MatchOutputAspect (keyframe : VideoMotionKeyframe, dMediaPixelAspect : double, dAspectOut : double)
{
    var keyframeSave = keyframe;
        
    try
    {
        var rotation = keyframe.Rotation;    
        
        // undo rotation so that we can get at correct aspect ratio.
        //
        keyframe.RotateBy (-rotation);

        var dWidth         = Math.abs(keyframe.TopRight.X   - keyframe.TopLeft.X);
        var dHeight        = Math.abs(keyframe.BottomLeft.Y - keyframe.TopLeft.Y);
        var dCurrentAspect = dMediaPixelAspect * dWidth / dHeight;
        var centerY        = keyframe.Center.Y;
        var centerX        = keyframe.Center.X;        
        
        var dFactor;
        
        var bounds = new VideoMotionBounds(keyframe.TopLeft, keyframe.TopRight, keyframe.BottomRight, keyframe.BottomLeft);

        if (dCurrentAspect < dAspectOut)
        {
            // alter y coords            
            dFactor = dCurrentAspect / dAspectOut;            
                        
            bounds.TopLeft.Y     = (bounds.TopLeft.Y     - centerY) * dFactor + centerY;
            bounds.TopRight.Y    = (bounds.TopRight.Y    - centerY) * dFactor + centerY;
            bounds.BottomLeft.Y  = (bounds.BottomLeft.Y  - centerY) * dFactor + centerY;
            bounds.BottomRight.Y = (bounds.BottomRight.Y - centerY) * dFactor + centerY;            
        }
        else
        {                          
            // alter x coords
            dFactor = dAspectOut / dCurrentAspect;            
                        
            bounds.TopLeft.X     = (bounds.TopLeft.X     - centerX) * dFactor + centerX;
            bounds.TopRight.X    = (bounds.TopRight.X    - centerX) * dFactor + centerX;
            bounds.BottomLeft.X  = (bounds.BottomLeft.X  - centerX) * dFactor + centerX;
            bounds.BottomRight.X = (bounds.BottomRight.X - centerX) * dFactor + centerX;
        }
        
        // set it to new bounds
        keyframe.Bounds = bounds;
        
        // restore rotation.        
        keyframe.RotateBy (rotation);
        
    }
    catch (e)
    {
        // restore original settings on error
        keyframe = keyframeSave;
        MessageBox.Show("MatchOuput: " + e);
    }    
}


var dWidthProject  = Vegas.Project.Video.Width;
var dHeightProject = Vegas.Project.Video.Height;
var dPixelAspect   = Vegas.Project.Video.PixelAspectRatio;
var dAspect        = dPixelAspect * dWidthProject / dHeightProject;
var cSelected      = GetSelectionCount (MediaType.Video);


var cTracks = Vegas.Project.Tracks.Count;
var ii;

for (ii = zero; ii < cTracks; ii ++)
{
    var track   = Vegas.Project.Tracks[ii];
    
    if (! track.IsVideo())
    {
        continue;
    }
    
    var eventEnum : Enumerator = new Enumerator(track.Events);        
    
    while ( ! eventEnum.atEnd() ) 
    {
        var trackEvent : TrackEvent = eventEnum.item();                                    
        
        if ( !cSelected || trackEvent.Selected )
        {                                            
            var mediaStream = GetActiveMediaStream (trackEvent);                
            
            if (mediaStream)
            {                                    
                var videoStream = VideoStream (mediaStream);
                    
                var dMediaPixelAspect = videoStream.PixelAspectRatio;
                var videoEvent        = VideoEvent(eventEnum.item());    
                var keyframes         = videoEvent.VideoMotion.Keyframes;
                
                var cKeyframes = keyframes.Count;
                var jj;
                
                for (jj = zero; jj < cKeyframes; jj ++)
                {
                    MatchOutputAspect (keyframes[jj], dMediaPixelAspect, dAspect);                                                                     
                }
            }
        }
        
        eventEnum.moveNext();
    }
}


Vegas.UpdateUI();



