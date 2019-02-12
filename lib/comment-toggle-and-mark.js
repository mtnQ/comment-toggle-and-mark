'use babel';

var commentStyles = require('./comment-styles.json');

import { CompositeDisposable } from 'atom';

/** Exactly what it looks like */
const SPACE = ' ';
/** Regular expression used for escaping special characters */
const ESCAPE_REGEX = /([\\\/\[\]{}()^$?*+.|])/g;

export default {

    subscriptions: null,

    // Current grammar scope
    style: null,
    // Current comment marking
    marking: null,
    // Regular expression used for toggling
    toggleRegex: null,
    // Regular expression used for deleting
    deleteRegex: null,

    config: {
        commentMark: {
            title: 'Comment Marking',
            description: 'Marking to use when toggling comments.',
            type: 'string',
            default: '~'
        }
    },

    activate() {
        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.subscriptions = new CompositeDisposable();
        this.subscriptions.add(
            atom.commands.add(
                'atom-workspace',
                {
                    'comment-toggle-and-mark:toggle': () => this.toggle(),
                    'comment-toggle-and-mark:delete': () => this.deleteMarkedComments()
                }
            )
        );
    },

    deactivate() {
        this.subscriptions.dispose();
    },

    serialize() { return {} },

    setStyleForGrammar(grammar) {
        if(!grammar) {
            return false;
        }

        const style = commentStyles.scope[grammar.scopeName];
        if(!style) {
            atom.notifications.addError("Unsupported scope: '" + grammar.scopeName + "'");
            return false;
        }

        this.style = style;
        this.marking = atom.config.get('comment-toggle-and-mark.commentMark');

        // Escape regex modifiers
        var prefixEsc  = this.style.pre.replace(ESCAPE_REGEX, '\\$1');
        var markingEsc = this.marking.replace(ESCAPE_REGEX, '\\$1');
        var suffixEsc  = this.style.post.replace(ESCAPE_REGEX, "\\$1");
        this.toggleRegex =
            new RegExp(
                // p1: Whitespace before comment prefix
                '^([^\\S\\r\\n]*)' + // could probably replace with (\s*)
                // p2: Marked comment prefix
                '(' + prefixEsc + markingEsc + SPACE + ')?' +
                // p3: Text between comment prefix and suffix
                '(.+?)' +
                // p4: Comment suffix
                '(' + SPACE + suffixEsc + ')?$',
                'gm'
            );
        this.deleteRegex =
            new RegExp(
                // p1: Whitespace before comment prefix
                '^([^\\S\\r\\n]*)' + // could probably replace with (\s*)
                // p2: Marked comment prefix
                '(' + prefixEsc + markingEsc + SPACE + ')' +
                // p3: Text between comment prefix and suffix
                '(.+?)?' +
                // p4: Comment suffix
                '(' + SPACE + suffixEsc + ')?$',
                'gm'
            );

        return true;
    },

    toggle() {
        const editor = atom.workspace.getActiveTextEditor();
        if(editor && this.setStyleForGrammar(editor.getGrammar())) {
	        // Ensure that our selected range begins at the start of the first line
	        //  and the end of the last line
            let range = editor.getSelectedBufferRange();
	        range.start.column = 0;
        	/** HACK:
        	 *  Calling setSelectedBufferRange() doesn't seem to handle the first line
        	 *   properly, so use setCursorBufferPosition() and selectDown() instead
        	 */
            editor.setCursorBufferPosition(range.start); // [range.start.row, 0]
            editor.selectDown(range.end.row - range.start.row);
          	editor.selectToEndOfLine();

            // Need to capture these in variables to allow toggleLine() to access
            var prefix = this.style.pre;
            var suffix = this.style.post;
            var marking = this.marking;
            function toggleLine(match, p1, p2, p3, p4) {
                var retval = p1;

                if(p2 === undefined) {
                    retval += prefix + marking + SPACE + p3;

                    if(p4 !== undefined) { // Instance of suffix already present
                        retval += p4;
                    }

                    if(suffix !== '') {
                        retval += SPACE + suffix;
                    }

                } else {
                    retval += p3;
                }

                return retval;
            }

            editor.insertText(
                editor.getSelectedText().replace(
                    this.toggleRegex,
                    toggleLine
                )
            );

            // Maintain highlighting
	        editor.setSelectedBufferRange(range);
  	        editor.selectToEndOfLine();
        }
    },

    deleteMarkedComments() {
        const editor = atom.workspace.getActiveTextEditor();
        if(editor && this.setStyleForGrammar(editor.getGrammar())) {
            var numMatches = 0;
            var nRows = editor.getLineCount();
            for(i = 0; i < nRows; ++i) {
                if(editor.lineTextForBufferRow(i).match(this.deleteRegex)) {
                    if(numMatches++ == 0) {
                        editor.setCursorBufferPosition([i, 0]);
                    } else {
                        editor.addCursorAtBufferPosition([i, 0]);
                    }
                }
            }

            if(numMatches > 0) {
                atom.notifications.addSuccess(
                    "Deleted " + numMatches + ((numMatches === 1) ? " line" : " lines")
                );
                editor.selectToEndOfLine(); // Highlight lines in case of undo
                editor.deleteLine();
                editor.setCursorBufferPosition([0, 0]);
            }
        }
    }

};
