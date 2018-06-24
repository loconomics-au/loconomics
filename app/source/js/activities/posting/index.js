/**
 * Allows a client to add, edit or copy a posting.
 *
 * @module activities/posting
 *
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import { EditorMode } from '../../kocomponents/posting/editor';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'posting';

export default class PostingActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.client;
        this.navBar = Activity.createSubsectionNavBar('Postings', {
            backLink: '/postings'
        });
        this.title = ko.pureComputed(() => {
            const id = this.userPostingID();
            if (this.editorMode() === EditorMode.copy || !id) {
                return 'Add Posting';
            }
            else {
                return 'Edit Posting';
            }
        });

        /**
         * Creates a placeholder for the ID
         * to be populated using the show(state) method below.
         */
        this.userPostingID = ko.observable(null);
        /**
         * Let's specify the wanted editor mode
         * @member {KnockoutObservable<string>}
         */
        this.editorMode = ko.observable('');

        /**
         * After data being saved, notice and go back
         */
        this.onSaved = () => {
            app.successSave({
                link: '/postings'
            });
        };

        /**
         * After data being saved, notice and go back
         */
        this.onDeleted = () => {
            app.successSave({
                message: 'Successfully deleted',
                link: '/postings'
            });
        };
    }

    show(state) {
        super.show(state);
        var params = state.route && state.route.segments;
        /**
         * userPostingID as the first segment in the activity URL,
         * allowing to preset that value in the new earnings entry.
         */
        this.userPostingID(params[0] |0);
        /**
         * Optional 'copy' mode as second segment
         */
        this.editorMode(params[1] === 'copy' ? EditorMode.copy : '');
    }
}

activities.register(ROUTE_NAME, PostingActivity);
