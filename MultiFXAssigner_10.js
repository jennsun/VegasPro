/*
 * Copyright (c) 2004, Folding Rain Filmworks Inc.
 *
 * author: Joe Howes (joeh@guild1.com)
 *
 * Coloring your final project in Vegas can be a bit of a bitch,
 * espcially if you have a complex project divided into multiple
 * sections.  When you're going through and coloring, you may find
 * that as you progress, coloring decisions you made early on
 * just look lame, and going back and updating all of them is a
 * pain in the ass because Vegas doesn't allow you to apply
 * changes to multiple events or media at the same time...you have
 * to go into each one individually.
 *
 * This script allows you to select one or more video events on the
 * timeline and apply effects and presets to either the events
 * themselves, or the media in the media pool.  This script has
 * saved me VAST amounts of time in finishing, and I hope it does
 * the same for you.
 *
 * NOTE:
 * - The reason you can't select items in the media pool and affect
 *   them directly is that in this version of Vegas (5.0b), the
 *   the scripting API doesn't allow you to check whether an item in
 *   the media pool is selected, so it would have to apply the effects
 *   to ALL media in the pool.
 *
 * - When affecting media, the effects are applied to all takes.
 *
 * - When affecting media, the algorithm is smart enough to check
 *   if a media pool item has already been affected and only process
 *   each one once.
 *
 * USAGE:
 * Select one or more video events on the timeline and run the script.
 * From the dialog choose one effect and (optional) preset at a time
 * and click "Add Effect" to add it to the stack of effects that will
 * be applied to all selected events or media.  Choose whether to
 * affect events or media, then click "Assign".
 *
 * v1.1: Sep. 24, 2004
 *
 * VERSION HISTORY:
 *
 * 1.1:
 * - Added the option to add to existing FX as well as replace.
 * - (Hopefully) fixed some GUI display issues...where labels were
 *   being truncated.
 */

import System.Windows.Forms;
import System.Text;
import System.Collections;
import Sony.Vegas;


/**
 * MAIN
 */
try {

	var fx = Vegas.VideoFX;				// Vegas effects list
	var done = false;					// If nothing is done, let the user know
	var plugInNameArray : ArrayList;	// PlugIn names the user has chosen
	var plugInFXArray : ArrayList;		// The plugins associated with those names
	var plugInPresetArray : ArrayList;	// The presets associated with those plugins
	var dlog = new FXReplacerDialog();	// The GUI


	// Init
	plugInFXArray = new ArrayList();


	// Show the GUI
	if (DialogResult.OK == dlog.ShowDialog()) {

		// Get the user's choices
		plugInNameArray = dlog.getPlugInNameArray();
		plugInPresetArray = dlog.getPlugInPresetArray();

		// Load the plugins the user has chosen
		var e = new Enumerator(plugInNameArray);
		while (!e.atEnd()) {
			var plugInName = e.item();
			e.moveNext();
			var plugIn = fx.GetChildByName(plugInName);
			if (null == plugIn) {
				throw "could not find a plug-in named: '" + plugInName + "'";
			}
			plugInFXArray.Add(plugIn);
		}

		// Pass those plugins and the user's preset choices to either
		// the event replacer or the media replacer
		var replaceFX = dlog.replaceExistingFXCheck.Checked;
		if (dlog.applyToEventsRadio.Checked) {
			done = replaceSelectedEventFX(plugInFXArray, plugInPresetArray, replaceFX);
		} else {
			done = replaceSelectedMediaFX(plugInFXArray, plugInPresetArray, replaceFX);
		}

	}


	// Only bother the user if no events or media were changed.
	/*if (!done) {
		MessageBox.Show("No events affected.", "Done!");
	}*/

} catch (e) {
    MessageBox.Show(e);
}


/**
 * FUNCTION: replaceSelectedEventFX
 * Iterate through all the video events and, if selected, remove all their
 * FX plugins and replace with the user's selections.
 */
function replaceSelectedEventFX(plugInArray:ArrayList, presetArray:ArrayList, replaceFX) {

	var done = false;

	for (var track in Vegas.Project.Tracks) {

		if (!track.IsVideo()) {
			continue;
		}


		for (var evnt in track.Events) {
			if (evnt.Selected) {
				replaceEventFX(evnt, plugInFXArray, plugInPresetArray, replaceFX);
				done = true;
			}
		}

	}

	return done;

}


/**
 * FUNCTION: replaceSelectedMediaFX
 * Iterate through all the video events and, if selected, remove all the plug-ins
 * associated with their media pool entries and replace with the user's selections.
 */
function replaceSelectedMediaFX(plugInArray:ArrayList, presetArray:ArrayList, replaceFX) {

	var done = false;
	var affectedMedia : ArrayList = new ArrayList();

	for (var track in Vegas.Project.Tracks) {

		if (!track.IsVideo()) {
			continue;
		}

		for (var evnt in track.Events) {

			if (evnt.Selected) {
				var e = new Enumerator(evnt.Takes);

				// Iterate through ALL the takes for this event and replace
				// the FX on their media pool entries.
				while (!e.atEnd()) {
					var take = e.item();
					e.moveNext();
					var media = take.Media;
					if (affectedMedia.Contains(media)) {
						continue;
					}
					replaceMediaFX(media, plugInFXArray, plugInPresetArray, replaceFX);
					affectedMedia.Add(media);
					done = true;
				}
			}

		}

	}

	return done;

}


/**
 * FUNCTION: replaceMediaFX
 * Assign all the plug-ins from plugInArray, along with the presets in presetArray,
 * to the media entity.  Note that if the user chose not to specify a preset for a
 * given plug-in, it's corresponding presetArray entry will be a null.
 */
function replaceMediaFX(media:Media, plugInArray:ArrayList, presetArray:ArrayList, replaceFX) {

	if (replaceFX) {

		var count = media.Effects.Count;

		// Kill all the existing FX
		while (count > 0) {
			media.Effects.RemoveAt(0);
			count = media.Effects.Count;
		}

	}

	// Assign all the new FX
	var e = new Enumerator(plugInArray);
	var e2 = new Enumerator(presetArray);
	while (!e.atEnd()) {
		var plugIn = e.item();
		e.moveNext();
		var effect = new Effect(plugIn);
		media.Effects.Add(effect);

		var preset = e2.item()
		e2.moveNext();

		if (null != preset) {
			effect.Preset = preset;
		}
	}

}


/**
 * FUNCTION: replaceEventFX
 * Assign all the plug-ins from plugInArray, along with the presets in presetArray,
 * to the event entity.  Note that if the user chose not to specify a preset for a
 * given plug-in, it's corresponding presetArray entry will be a null.
 */
function replaceEventFX(evnt:VideoEvent, plugInArray:ArrayList, presetArray:ArrayList, replaceFX) {

	if (replaceFX) {

		var count = evnt.Effects.Count;

		// Kill all the existing FX
		while (count > 0) {
			evnt.Effects.RemoveAt(0);
			count = evnt.Effects.Count;
		}

	}

	// Assign all the new FX
	var e = new Enumerator(plugInArray);
	var e2 = new Enumerator(presetArray);
	while (!e.atEnd()) {
		var plugIn = e.item();
		e.moveNext();
		var effect = new Effect(plugIn);
		evnt.Effects.Add(effect);

		var preset = e2.item()
		e2.moveNext();

		if (null != preset) {
			effect.Preset = preset;
		}
	}

}



/**
 * CLASS: FXReplacerDialog
 * The GUI.
 */
class FXReplacerDialog extends Form {

	var videoFXListBox : ListBox;			// All Vegas' video FX will be listed here
	var fxPresetListBox : ListBox;			// All the presets
	var finalApplicationListBox : ListBox;	// All the user's choices

	var applyToEventsRadio : RadioButton;
	var applyToMediaRadio : RadioButton;
	var replaceExistingFXCheck : CheckBox;		// Replace or add to FX chain?

	var addFXButton : Button;
    var removeFXButton : Button;

    var assignButton : Button;
    var cancelButton : Button;

    var videoFXParamGroup : GroupBox;
    var fxPresetParamGroup : GroupBox;
    var finalApplicationsParamGroup : GroupBox;

    var presetList : ArrayList;				// An ArrayList of ArrayLists holding presets
    										// for each plug-in
    var plugInNameArray : ArrayList;		// Contains the user's chosen plug-in names
    var plugInPresetArray : ArrayList;		// Contains the user's chosen preset names


	/**
	 * CONSTRUCTOR
	 * Init everything.
	 */
    function FXReplacerDialog() {

    	this.Text = "Assign Plug-Ins to Selected Events or their Media";
		this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		this.MaximizeBox = false;
		this.StartPosition = FormStartPosition.CenterScreen;

		plugInNameArray = new ArrayList();
		plugInPresetArray = new ArrayList();

		this.Width = 470;
		this.Height = 480;


		// VideoFX
		this.videoFXListBox = new ListBox();
		videoFXListBox.Location = new System.Drawing.Point(8, 18);
		videoFXListBox.Name = "videoFXListBox";
		videoFXListBox.Size = new System.Drawing.Size(200, 200);
		videoFXListBox.TabIndex = 1;
		videoFXListBox.add_Click(this.videoFXListBoxOnClick);

		// VideoFX ParamGroup
		videoFXParamGroup = new GroupBox();
		videoFXParamGroup.Controls.Add(videoFXListBox);
		videoFXParamGroup.Location = new System.Drawing.Point(8, 8);
		videoFXParamGroup.Name = "videoFXParamGroup";
		videoFXParamGroup.Size = new System.Drawing.Size(216, 225);
		//videoFXParamGroup.TabIndex = -1;
		videoFXParamGroup.TabStop = false;
		videoFXParamGroup.Text = "Choose a Plug-In";

		this.Controls.Add(videoFXParamGroup);


		// FX Presets
		this.fxPresetListBox = new ListBox();
		fxPresetListBox.Location = new System.Drawing.Point(8, 18);
		fxPresetListBox.Name = "fxPresetListBox";
		fxPresetListBox.Size = new System.Drawing.Size(200, 200);
		fxPresetListBox.TabIndex = 2;

		// FX Presets ParamGroup
		fxPresetParamGroup = new GroupBox();
		fxPresetParamGroup.Controls.Add(fxPresetListBox);
		fxPresetParamGroup.Location = new System.Drawing.Point(240, 8);
		fxPresetParamGroup.Name = "fxPresetParamGroup";
		fxPresetParamGroup.Size = new System.Drawing.Size(216, 225);
		//fxPresetParamGroup.TabIndex = -1;
		fxPresetParamGroup.TabStop = false;
		fxPresetParamGroup.Text = "Choose a Preset (optional)";

		this.Controls.Add(fxPresetParamGroup);


		// Final Applications
		this.finalApplicationListBox = new ListBox();
		finalApplicationListBox.Location = new System.Drawing.Point(8, 18);
		finalApplicationListBox.Name = "finalApplicationsListBox";
		finalApplicationListBox.Size = new System.Drawing.Size(400, 100);
		finalApplicationListBox.TabIndex = 5;

		// Replace or Add?
		replaceExistingFXCheck = new CheckBox();
		replaceExistingFXCheck.Location = new System.Drawing.Point(25, 125);
		replaceExistingFXCheck.Size = new System.Drawing.Size(125, 18);
		replaceExistingFXCheck.Name = "replaceExistingFXCheck";
		replaceExistingFXCheck.TabIndex = 6;
		replaceExistingFXCheck.Checked = true;
		replaceExistingFXCheck.Text = "Replace Existing FX";

		// Events or Media Radios
		applyToEventsRadio = new RadioButton();
		applyToEventsRadio.Location = new System.Drawing.Point(190, 125);
		applyToEventsRadio.Size = new System.Drawing.Size(110, 18);
		applyToEventsRadio.Name = "applytoEventsRadio";
		applyToEventsRadio.TabIndex = 7;
		applyToEventsRadio.Text = "Apply to Events";

		applyToMediaRadio = new RadioButton();
		applyToMediaRadio.Location = new System.Drawing.Point(300, 125);
		applyToMediaRadio.Size = new System.Drawing.Size(110, 18);
		applyToMediaRadio.Name = "applyToMediaRadio";
		applyToMediaRadio.TabIndex = 8;
		applyToMediaRadio.Checked = true;
		applyToMediaRadio.Text = "Apply to Media";

		// Final Applications ParamGroup
		finalApplicationsParamGroup = new GroupBox();
		finalApplicationsParamGroup.Controls.Add(finalApplicationListBox);
		finalApplicationsParamGroup.Controls.Add(replaceExistingFXCheck);
		finalApplicationsParamGroup.Controls.Add(applyToEventsRadio);
		finalApplicationsParamGroup.Controls.Add(applyToMediaRadio);
		finalApplicationsParamGroup.Location = new System.Drawing.Point(25, 270);
		finalApplicationsParamGroup.Name = "finalApplicationsParamGroup";
		finalApplicationsParamGroup.Size = new System.Drawing.Size(416, 150);
		//finalApplicationsParamGroup.TabIndex = 4;
		finalApplicationsParamGroup.TabStop = false;
		finalApplicationsParamGroup.Text = "FX to Assign";

		this.Controls.Add(finalApplicationsParamGroup);


		// Add Effect button
		addFXButton = new Button();
		addFXButton.Text = "Add Effect";
		addFXButton.Left = 124;
		addFXButton.Top = 240;
		addFXButton.Width = 100;
		addFXButton.add_Click(this.addFXOnClick);
		addFXButton.Enabled = false;
		addFXButton.TabIndex = 3;
        Controls.Add(addFXButton);

		// Remove Effect button
        removeFXButton = new Button();
		removeFXButton.Text = "Remove Effect";
		removeFXButton.Left = 240;
		removeFXButton.Top = 240;
		removeFXButton.Width = 100;
		removeFXButton.add_Click(this.removeFXOnClick);
		removeFXButton.Enabled = false;
		removeFXButton.TabIndex = 4;
        Controls.Add(removeFXButton);

		// Assign button
        assignButton = new Button();
        assignButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		assignButton.Text = "Assign";
		assignButton.Left = 300;
		assignButton.Top = 425;
		AcceptButton = assignButton;
		assignButton.TabIndex = 9;
        Controls.Add(assignButton);

		// Cancel button
        cancelButton = new Button();
		cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		cancelButton.Text = "Cancel";
		cancelButton.Left = 380;
		cancelButton.Top = 425;
		CancelButton = cancelButton;
		cancelButton.TabIndex = 10;
        Controls.Add(cancelButton);


        populate();

    }


	/**
	 * FUNCTION: populate
	 * Populates the data model with all of Vegas' plug-ins and presets.
	 */
    function populate() {

		var fx = Vegas.VideoFX;
		var plugInList = new ArrayList();
		presetList = new ArrayList();

		var e = new Enumerator(fx);
		var first = true;
		videoFXListBox.BeginUpdate();

		// Get all the plug-ins
		while (!e.atEnd()) {

			if (first) {
				first = false;
				e.moveNext();
				continue;
			}

			var plugIn = e.item();
			e.moveNext();
			plugInList.Add(plugIn.Name);

		}

		plugInList.Sort();

		// Populate the videoFX list box and the presets data model
		var e = new Enumerator(plugInList);

		while (!e.atEnd()) {

			var plugInName = e.item();
			e.moveNext();
			videoFXListBox.Items.Add(plugInName);

			var plugIn = fx.GetChildByName(plugInName);
			var presets : ArrayList = new ArrayList();
			var e2 = new Enumerator(plugIn.Presets);

			while (!e2.atEnd()) {
				var preset = e2.item();
				e2.moveNext();
				presets.Add(preset.Name);
			}
			presetList.Add(presets);
		}

		videoFXListBox.EndUpdate();

	}

	/**
	 * FUNCTION: videoFXListBoxOnClick
	 * Event handler for clicks on the videoFXListBox.  We update GUI buttons,
	 * populate the preset box.
	 */
	function videoFXListBoxOnClick(sender : Object, evt : System.EventArgs) {

		var index = videoFXListBox.SelectedIndex;

		// If there's at least one item selected in the list, enable the
		// Add Effect button.
		if (index != -1) {
			addFXButton.Enabled = true;
		}


		// Get the presets for the chosen plug-in and populate the presets box.
		var presets : ArrayList = presetList.Item(videoFXListBox.SelectedIndex);

		fxPresetListBox.BeginUpdate();
		fxPresetListBox.Items.Clear();

		var e = new Enumerator(presets);

		while (!e.atEnd()) {
			var preset = e.item();
			e.moveNext();
			fxPresetListBox.Items.Add(preset);
		}

		fxPresetListBox.EndUpdate();

	}


	/**
	 * FUNCTION: addFXOnClick
	 * When the Add Effect button is clicked, reflect the user's choice
	 * both in the GUI and in the underlying data model.
	 */
	function addFXOnClick(sender: Object, evt : System.EventArgs) {

		// Add the plug-in choice
		var plugInName = videoFXListBox.SelectedItem.toString();
		var presetIndex = fxPresetListBox.SelectedIndex;
		var plugInPreset = null;
		if (presetIndex != -1) {
			plugInPreset = fxPresetListBox.SelectedItem.toString();
		}

		var displayString = new StringBuilder(plugInName);

		// If a preset is chosen, add that too
		if (presetIndex != -1) {
			displayString.Append(" - <");
			displayString.Append(plugInPreset);
			displayString.Append(">");
		}

		finalApplicationListBox.Items.Add(displayString);

		// Add the plug-in choice to the data model
		plugInNameArray.Add(plugInName);

		// If there is a preset choice, add that, otherwise add null
		if (presetIndex != -1) {
			plugInPresetArray.Add(plugInPreset);
		} else {
			plugInPresetArray.Add(null);
		}

		// If there is at least one item available in the FX to Assign box,
		// enable the Remove Effect button
		var removeEnabled = (finalApplicationListBox.Items.Count > 0) ? true : false;
		removeFXButton.Enabled = removeEnabled;
	}

	/**
	 * FUNCTION: removeFXOnClick
	 * Remove the selected cohice from the FX to Assign box and from the data model.
	 */
	function removeFXOnClick(sender: Object, evt : System.EventArgs) {

		// Remove from the data model
		plugInNameArray.RemoveAt(finalApplicationListBox.SelectedIndex);
		plugInPresetArray.RemoveAt(finalApplicationListBox.SelectedIndex);

		// Remove from the GUI
		finalApplicationListBox.BeginUpdate();
		finalApplicationListBox.Items.Remove(finalApplicationListBox.SelectedItem);
		finalApplicationListBox.EndUpdate();
		var removeEnabled = (finalApplicationListBox.Items.Count > 0) ? true : false;
		removeFXButton.Enabled = removeEnabled;
	}

	/**
	 * FUNCTION: getPlugInNameArray
	 * Accessor for the user's plug-in choices.
	 */
	function getPlugInNameArray() {
		return plugInNameArray;
	}

	/**
	 * FUNCTION: getPlugInPresetArray
	 * Accessor for the user's preset choices.
	 */
	function getPlugInPresetArray() {
		return plugInPresetArray;
	}

}

