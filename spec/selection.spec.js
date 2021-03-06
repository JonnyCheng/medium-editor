/*global MediumEditor, describe, it, expect, spyOn,
         afterEach, beforeEach, fireEvent,
         jasmine, selectElementContents, tearDown,
         selectElementContentsAndFire, Selection */

describe('Selection TestCase', function () {
    'use strict';

    beforeEach(function () {
        this.el = document.createElement('div');
        this.el.className = 'editor';
        this.el.innerHTML = 'lorem ipsum';
        document.body.appendChild(this.el);
        jasmine.clock().install();
    });

    afterEach(function () {
        tearDown(this.el);
        jasmine.clock().uninstall();
    });

    describe('Exposure', function () {
        it('is exposed on the MediumEditor ctor', function () {
            expect(MediumEditor.selection).toBeTruthy();
            expect(MediumEditor.selection).toEqual(Selection);
        });
    });

    describe('Export/Import Selection', function () {
        it('should be able to import an exported selection', function () {
            this.el.innerHTML = 'lorem <i>ipsum</i> dolor';
            var editor = new MediumEditor('.editor', {
                buttons: ['italic', 'underline', 'strikethrough']
            });

            selectElementContents(editor.elements[0].querySelector('i'));
            var exportedSelection = editor.exportSelection();
            expect(Object.keys(exportedSelection).sort()).toEqual(['end', 'start']);

            selectElementContents(editor.elements[0]);
            expect(exportedSelection).not.toEqual(editor.exportSelection());

            editor.importSelection(exportedSelection);
            expect(exportedSelection).toEqual(editor.exportSelection());
        });

        it('should have an index in the exported selection when it is in the second contenteditable', function () {
            var el2 = document.createElement('div');
            el2.className = 'editor';
            el2.innerHTML = 'lorem <i>ipsum</i> dolor';
            try {
                document.body.appendChild(el2);
                var editor = new MediumEditor('.editor', {
                    buttons: ['italic', 'underline', 'strikethrough']
                });

                selectElementContents(editor.elements[1].querySelector('i'));
                var exportedSelection = editor.exportSelection();
                expect(Object.keys(exportedSelection).sort()).toEqual(['editableElementIndex', 'end', 'start']);
                expect(exportedSelection.editableElementIndex).toEqual(1);
            } finally {
                document.body.removeChild(el2);
            }
        });
    });

    describe('Saving Selection', function () {
        it('should be applicable if html changes but text does not', function () {
            this.el.innerHTML = 'lorem <i>ipsum</i> dolor';

            var editor = new MediumEditor('.editor', {
                buttons: ['italic', 'underline', 'strikethrough']
            }),
                button,
                regex;

            // Save selection around <i> tag
            selectElementContents(editor.elements[0].querySelector('i'));
            editor.saveSelection();

            // Underline entire element
            selectElementContents(editor.elements[0]);
            button = editor.toolbar.getToolbarElement().querySelector('[data-action="underline"]');
            fireEvent(button, 'click');

            // Restore selection back to <i> tag and add a <strike> tag
            regex = new RegExp('^<u>lorem (<i><strike>|<strike><i>)ipsum(</i></strike>|</strike></i>) dolor</u>$');
            editor.restoreSelection();
            button = editor.toolbar.getToolbarElement().querySelector('[data-action="strikethrough"]');
            fireEvent(button, 'click');
            expect(regex.test(editor.elements[0].innerHTML)).toBe(true);
        });
    });

    describe('CheckSelection', function () {
        it('should check for selection on mouseup event', function () {
            spyOn(MediumEditor.statics.Toolbar.prototype, 'checkState');
            var editor = new MediumEditor('.editor');
            fireEvent(editor.elements[0], 'mouseup');
            expect(editor.toolbar.checkState).toHaveBeenCalled();
        });

        it('should check for selection on keyup', function () {
            spyOn(MediumEditor.statics.Toolbar.prototype, 'checkState');
            var editor = new MediumEditor('.editor');
            fireEvent(editor.elements[0], 'keyup');
            expect(editor.toolbar.checkState).toHaveBeenCalled();
        });

        it('should hide the toolbar if selection is empty', function () {
            spyOn(MediumEditor.statics.Toolbar.prototype, 'setToolbarPosition').and.callThrough();
            spyOn(MediumEditor.statics.Toolbar.prototype, 'setToolbarButtonStates').and.callThrough();
            spyOn(MediumEditor.statics.Toolbar.prototype, 'showAndUpdateToolbar').and.callThrough();
            var editor = new MediumEditor('.editor');
            editor.toolbar.getToolbarElement().style.display = 'block';
            editor.toolbar.getToolbarElement().classList.add('medium-editor-toolbar-active');
            expect(editor.toolbar.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(true);
            editor.checkSelection();
            expect(editor.toolbar.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(false);
            expect(editor.toolbar.setToolbarPosition).not.toHaveBeenCalled();
            expect(editor.toolbar.setToolbarButtonStates).not.toHaveBeenCalled();
            expect(editor.toolbar.showAndUpdateToolbar).not.toHaveBeenCalled();
        });

        it('should hide the toolbar when selecting multiple paragraphs and the allowMultiParagraphSelection option is false', function () {
            this.el.innerHTML = '<p id="p-one">lorem ipsum</p><p id="p-two">lorem ipsum</p>';
            var editor = new MediumEditor('.editor', {
                allowMultiParagraphSelection: false
            });
            selectElementContentsAndFire(document.getElementById('p-one'), { eventToFire: 'focus' });
            expect(editor.toolbar.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(true);
            selectElementContentsAndFire(this.el, { eventToFire: 'mouseup' });
            expect(editor.toolbar.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(false);
        });

        it('should show the toolbar when something is selected', function () {
            var editor = new MediumEditor('.editor');
            expect(editor.toolbar.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(false);
            selectElementContentsAndFire(this.el);
            jasmine.clock().tick(501);
            expect(editor.toolbar.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(true);
        });

        it('should update toolbar position and button states when something is selected', function () {
            spyOn(MediumEditor.statics.Toolbar.prototype, 'setToolbarPosition').and.callThrough();
            spyOn(MediumEditor.statics.Toolbar.prototype, 'setToolbarButtonStates').and.callThrough();
            spyOn(MediumEditor.statics.Toolbar.prototype, 'showAndUpdateToolbar').and.callThrough();
            var editor = new MediumEditor('.editor');
            selectElementContentsAndFire(this.el);
            jasmine.clock().tick(51);
            expect(editor.toolbar.setToolbarPosition).toHaveBeenCalled();
            expect(editor.toolbar.setToolbarButtonStates).toHaveBeenCalled();
            expect(editor.toolbar.showAndUpdateToolbar).toHaveBeenCalled();
        });

        it('should update button states for static toolbar when updateOnEmptySelection is true and the selection is empty', function () {
            spyOn(MediumEditor.statics.Toolbar.prototype, 'setToolbarButtonStates').and.callThrough();

            var editor = new MediumEditor('.editor', {
                updateOnEmptySelection: true,
                staticToolbar: true
            });

            selectElementContentsAndFire(this.el, { collapse: 'toStart' });
            jasmine.clock().tick(51);

            expect(editor.toolbar.setToolbarButtonStates).toHaveBeenCalled();
        });
    });

});
