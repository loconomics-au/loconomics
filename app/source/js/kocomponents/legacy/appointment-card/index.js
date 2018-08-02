/**
 * It provides data and method to visualize and
 * edit and appointment card, with booking, event
 * or placeholder information
 *
 * Legacy state: original component goal was to remove some complexity from the appointment
 * activity, but is still too much complex that needs refactor and adapt to
 * the Komponent class.
 *
 *
 * @module kocomponents/legacy/appointment-card
 */
import '../../utilities/icon-dec';
import Address from '../../../models/Address';
import Appointment from '../../../models/Appointment';
import AppointmentView from '../../../viewmodels/AppointmentView';
import Booking from '../../../models/Booking';
import { EventEmitter } from 'events';
import ModelVersion from '../../../utils/ModelVersion';
import PricingSummaryDetail from '../../../models/PricingSummaryDetail';
import bookings from '../../../data/bookings';
import calendar from '../../../data/calendar';
import getDateWithoutTime from '../../../utils/getDateWithoutTime';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import moment from 'moment';
import paymentAccount from '../../../data/paymentAccount';
import payoutPreferenceRequired from '../../../modals/payoutPreferenceRequired';
import { show as showConfirm } from '../../../modals/confirm';
import { show as showError } from '../../../modals/error';
import { show as showNotification } from '../../../modals/notification';
import { show as showTextEditor } from '../../../modals/textEditor';
import template from './template.html';

const TAG_NAME = 'legacy-appointment-card';

/**
 * Type of appointment changes events
 * @enum {string}
 */
export const events = {
    confirmed: 'confirmed',
    declined: 'declined',
    cancelled: 'cancelled'
};

/**
 *
 * @param {Object} params
 * @param {KnockoutObservable<ComponentViewModel>} [params.api] A hook to provide a
 * reference of the view model instance to the code where the component is used
 * so can call method directly.
 * @param {models/Appointment} params.sourceItem The appointment to display/edit
 * @param {Object} params.app Reference to the App instance to be able to use
 * global objects/methods attached to it
 * @param {(boolean|KnockoutObservable<boolean>)} params.editMode Whether is
 * or not in edit mode.
 * @param {(boolean|KnockoutObservable<boolean>)} params.isLoading Whether there
 * is data being loaded
 */
export default function ComponentViewModel(params) {
    /* eslint max-statements:"off" */

    EventEmitter.call(this);

    this.sourceItem = getObservable(params.sourceItem);
    var app = this.app = ko.unwrap(params.app);

    this.editMode = getObservable(params.editMode);
    this.editedVersion = ko.observable(null);

    this.isSaving = ko.observable(false);
    this.isLoading = getObservable(params.isLoading);

    this.item = ko.observable(AppointmentView(this.sourceItem(), app));

    this.allowBookUnavailableTime = ko.observable(false);

    this.specialAppointmentIds = Appointment.specialIds;

    this.currentID = ko.pureComputed(function() {
        var it = this.item();
        return it && it.id() || 0;
    }, this);

    this.currentDatetime = ko.pureComputed(function() {
        return this.item() && this.item().startTime() || new Date();
    }, this);

    this.currentDate = ko.pureComputed(function() {
        return getDateWithoutTime(this.item() && this.item().startTime());
    }, this);

    this.isNew = ko.pureComputed(function() {
        var id = this.currentID();
        return id === Appointment.specialIds.newBooking || id === Appointment.specialIds.newEvent;
    }, this);

    this.isBooking = ko.pureComputed(function() {
        return this.item() && this.item().sourceBooking();
    }, this);

    /* Return true if is an event object but not a booking */
    this.isEvent = ko.pureComputed(function() {
        return this.item() && this.item().sourceEvent() && !this.item().sourceBooking();
    }, this);

    this.isReadOnlyEvent = ko.pureComputed(function() {
        if (this.isEvent()) {
            return this.item().sourceEvent().readOnly();
        }
        // Is not an event
        return false;
    }, this);

    this.isLocked = ko.pureComputed(function() {
        return this.isReadOnlyEvent() || this.isSaving() || this.isLoading();
    }, this);

    this.headerClass = ko.pureComputed(function() {
        return (
            this.isBooking() ? (this.editMode() ? 'Card-title--warning' : 'Card-title--primary') :
            this.isEvent() ? 'Card-title--danger' :
            ''
        );
    }, this);

    this.newAppointmentVisible = ko.pureComputed(function() {
        var id = this.currentID();
        return id === Appointment.specialIds.free || id === Appointment.specialIds.emptyDate || id === Appointment.specialIds.unavailable;
    }, this);

    this.editScheduleVisible = ko.pureComputed(function() {
        return this.currentID() === Appointment.specialIds.unavailable;
    }, this);

    this.submitText = ko.pureComputed(function() {
        var v = this.editedVersion();
        return (
            this.isLoading() ?
                'Loading...' :
                this.isSaving() ?
                    'Saving changes' :
                    v && v.areDifferent() ?
                        this.isNew() && this.isBooking() ?
                            'Schedule' :
                            'Save changes'
                        : 'Saved'
        );
    }, this);

    /**
        If the sourceItem changes, is set as the item value
        discarding any model version and reverting
        editMode to false
    **/
    this.sourceItem.subscribe(function(sourceItem) {
        this.item(AppointmentView(sourceItem, app));
        this.editedVersion(null);
        this.editMode(false);

        // If the new item is a new one, set edit mode
        if (this.isNew()) {
            this.editMode(true);
        }
    }, this);

    /**
        Enter and finish edit:
        Create version and save data
    **/
    this.editMode.subscribe(function(isEdit) {
        if (this.currentID() <= 0 && !this.isNew()) {
            return;
        }
        if (isEdit) {
            // Create and set a version to be edited
            var version = new ModelVersion(this.sourceItem());
            version.version.sourceEvent(this.sourceItem().sourceEvent());
            version.version.sourceBooking(this.sourceItem().sourceBooking());
            this.editedVersion(version);
            this.item(AppointmentView(version.version, app));

            if (this.isNew() && this.isEvent()) {
                // Some defaults for events
                this.item().sourceEvent().availabilityTypeID(0); // Unavailable
                this.item().isAllDay(false);
                this.item().sourceEvent().eventTypeID(3); // Appointment/block-time
                this.item().summary('');
            }
        }
        else {
            this.item(AppointmentView(this.sourceItem(), app));
        }
    }, this);

    this.edit = function edit() {
        if (this.isLocked()) return;

        // A subscribed handler ensure to do the needed tasks
        this.editMode(true);
    }.bind(this);

    var afterSave = function afterSave(savedApt) {
        var version = this.editedVersion();
        // Do not do a version push, just update with remote
        //version.push({ evenIfObsolete: true });
        // Update with remote data, the original appointment in the version,
        // not the currentAppointment or in the index in the list to avoid
        // race-conditions
        version.original.model.updateWith(savedApt, true);
        // Do a pull so original and version gets the exact same data
        version.pull({ evenIfNewer: true });

        // Go out edit mode
        this.editMode(false);

        // Notify
        if (this.isBooking() && this.item().client()) {

            var msg = this.item().client().firstName() + ' will receive an e-mail confirmation.';

            showNotification({
                title: 'Confirmed!',
                message: msg
            });
        }
    }.bind(this);

    this.save = function save() {
        if (this.isLocked()) return;

        // There is a version? Push changes!
        var version = this.editedVersion();

        if (version && version.areDifferent()) {
            this.isSaving(true);
            calendar.setAppointment(version.version, this.allowBookUnavailableTime())
            .then(afterSave)
            .catch(function(err) {
                // The version data keeps untouched, user may want to retry
                // or made changes on its un-saved data.
                // Show error
                showError({
                    title: 'There was an error saving the data.',
                    error: err
                });
                // Don't replicate error, allow always
            })
            .then(function() {
                // ALWAYS:
                this.isSaving(false);
            }.bind(this));
        }
    }.bind(this);

    this.cancel = function cancel() {
        if (this.isLocked()) return;

        if (this.editedVersion()) {
            // Discard previous version
            this.editedVersion().pull({ evenIfNewer: true });
        }
        // Out of edit mode
        this.editMode(false);
    }.bind(this);

    this.confirmCancel = function confirmCancel() {
        var v = this.editedVersion();
        if (v && v.areDifferent()) {
            showConfirm({
                title: 'Cancel',
                message: 'Are you sure?',
                yes: 'Yes',
                no: 'No'
            })
            .then(function() {
                // Confirmed cancellation:
                this.cancel();
            }.bind(this));
        }
        else {
            this.cancel();
        }
    }.bind(this);

    // Delete Event
    this.deleteEvent = function() {
        // TODO
    };

    /**
        Special updates and related flags
    **/
    this.bookingID = ko.pureComputed(function() {
        return this.item() && this.item().sourceBooking() && this.item().sourceBooking().bookingID();
    }, this);

    this.bookingCanBeCancelledByServiceProfessional = ko.computed(function() {
        var b = this.item() && this.item().sourceBooking();
        return b ? b.canBeCancelledByServiceProfessional() : false;
    }, this);

    this.bookingCanBeDeclinedByServiceProfessional = ko.computed(function() {
        var b = this.item() && this.item().sourceBooking();
        return b ? b.canBeDeclinedByServiceProfessional() : false;
    }, this);

    this.isBookingRequest = ko.pureComputed(function() {
        var b = this.item() && this.item().sourceBooking();
        return b ? b.isRequest() : false;
    }, this);

    this.isServiceProfessionalBooking = ko.pureComputed(function() {
        var b = this.item() && this.item().sourceBooking();
        return b ? b.isServiceProfessionalBooking() : false;
    }, this);

    // IMPORTANT Editing rule
    this.canChangePricing = ko.pureComputed(function() {
        if (this.isNew()) return true;
        var b = this.item() && this.item().sourceBooking();
        if (b) {
            var bt = b.bookingTypeID();
            return (
                bt === Booking.type.serviceProfessionalBooking || (
                    bt === Booking.type.bookNowBooking &&
                    !b.paymentCollected
                )
            );
        }
        return false;
    }, this);

    // For booking cancel/decline/confirm.
    var afterSaveBooking = function(booking, saveEvent) {
        var version = this.editedVersion();
        if (version) {
            version.original.sourceBooking(booking);
            version.pull({ evenIfNewer: true });

            // Go out edit mode
            this.editMode(false);
        }
        else {
            this.sourceItem().sourceBooking(booking);
        }

        var msg = this.item().client().firstName() + ' will receive an e-mail confirmation.';

        showNotification({
            title: 'Done!',
            message: msg
        })
        .then(function() {
            this.emit(saveEvent, this.sourceItem());
        }.bind(this));
    }.bind(this);

    this.cancelBookingByServiceProfessional = function() {
        if (!this.bookingCanBeCancelledByServiceProfessional()) return;
        this.isSaving(true);
        bookings.cancelBookingByServiceProfessional(this.bookingID())
        .then(function(booking) { afterSaveBooking(booking, events.cancelled); })
        .catch(function(err) {
            // The version data keeps untouched, user may want to retry
            // or made changes on its un-saved data.
            // Show error
            showError({
                title: 'There was an error saving the data.',
                error: err
            });
            // Don't replicate error, allow always
        })
        .then(function() {
            // ALWAYS:
            this.isSaving(false);
        }.bind(this));
    };

    this.declineBookingByServiceProfessional = function() {
        if (!this.isBookingRequest()) return;
        this.isSaving(true);
        bookings.declineBookingByServiceProfessional(this.bookingID())
        .then(function(booking) { afterSaveBooking(booking, events.declined); })
        .catch(function(err) {
            // The version data keeps untouched, user may want to retry
            // or made changes on its un-saved data.
            // Show error
            showError({
                title: 'There was an error saving the data.',
                error: err
            });
            // Don't replicate error, allow always
        })
        .then(function() {
            // ALWAYS:
            this.isSaving(false);
        }.bind(this));
    };
    // dateType values allowed by REST API: 'preferred', 'alternative1', 'alternative2'
    this.confirmBookingRequest = function(dateType) {
        if (!this.isBookingRequest()) return;
        this.isSaving(true);
        bookings.confirmBookingRequest(this.bookingID(), dateType)
        .then(function(booking) { afterSaveBooking(booking, events.confirmed); })
        .catch(function(err) {
            // The version data keeps untouched, user may want to retry
            // or made changes on its un-saved data.
            // Show error
            showError({
                title: 'There was an error saving the data.',
                error: err
            });
            // Don't replicate error, allow always
        })
        .then(function() {
            // ALWAYS:
            this.isSaving(false);
        }.bind(this));
    };

    this.confirmCancelBookingByServiceProfessional = function() {
        showConfirm({
            title: 'Cancel booking',
            message: 'Are you sure?',
            yes: 'Yes',
            no: 'No'
        })
        .then(function() {
            // Confirmed:
            this.cancelBookingByServiceProfessional();
        }.bind(this));
    }.bind(this);

    /// Booking Request selectable options
    this.selectedRequestDateType = ko.observable();
    this.observerSelected = function(dateType) {
        return ko.pureComputed(function() {
            return this.selectedRequestDateType() === ko.unwrap(dateType);
        }, this);
    }.bind(this);
    /**
     * It validates if professional has set-up a payout preference, only if
     * done it can accept a booking request
     * @returns {Promise<boolean>} Whether satisfy validation or not
     */
    this.validatePayoutPreference = function() {
        return paymentAccount.whenLoaded()
        .then(function() {
            return paymentAccount.data.isReady();
        }.bind(this));
    };
    this.setSelectedRequestDateType = function(dateType) {
        if (dateType) {
            var performSelection = function() {
                this.selectedRequestDateType(dateType);
            }.bind(this);

            this.validatePayoutPreference()
            .then(function(isValid) {
                if (isValid) {
                    performSelection();
                }
                else {
                    // Direct user to set-up a payout preference
                    payoutPreferenceRequired.show({
                        reason: payoutPreferenceRequired.Reason.acceptBookingRequest
                    })
                    .then(function(done) {
                        if (done) {
                            performSelection();
                        }
                    })
                    .catch(function(err) {
                        showError({
                            title: 'Unable to set-up payout preference',
                            error: err
                        });
                    });
                }
            });
        }
    }.bind(this);

    this.performSelectedBookingRequestAnswer = function() {
        var option = this.selectedRequestDateType();
        if (option === 'deny')
            return this.declineBookingByServiceProfessional();
        else
            return this.confirmBookingRequest(option);
    }.bind(this);

    /**
        External actions
    **/
    var editFieldOn = function editFieldOn(activity, data) {

        // Include appointment to recover state on return:
        data.appointment = this.item().model.toPlainObject(true);

        data.cancelLink = this.cancelLink;

        if (this.progress &&
            !this.progress.ended) {
            data.progress = this.progress;
            var step = data.progress.step || 1;
            var total = data.progress.total || 1;
            // TODO I18N
            data.title = step + ' of ' + total;
            data.navTitle = null;
        } else {
            // keep data.progress so it does not restart the process after
            // an edition. The passIn already resets that on new calls
            data.progress = this.progress;
            // Edition title:
            data.title = null;
            data.navTitle = this.isBooking() ? 'Booking' : 'Event';
        }

        app.shell.go(activity, data);
    }.bind(this);

    this.pickDateTime = function pickDateTime() {
        if (this.isLocked()) return;

        var item = this.item();
        item.getServiceDurationMinutes().then(function(minutes){
            editFieldOn('datetimePicker', {
                selectedDatetime: item.startTime(),
                datetimeField: 'startTime',
                headerText: 'Select the start time',
                requiredDuration: minutes
            });
        });
    }.bind(this);

    this.pickEndDateTime = function pickEndDateTime() {
        if (this.isLocked()) return;

        editFieldOn('datetimePicker', {
            selectedDatetime: this.item().endTime(),
            datetimeField: 'endTime',
            headerText: 'Select the end time',
            includeEndTime: true
        });
    }.bind(this);

    this.pickClient = function pickClient() {
        if (this.isLocked()) return;

        editFieldOn('clients', {
            selectClient: true,
            selectedClientID: this.item().sourceBooking().clientUserID()
        });
    }.bind(this);

    this.pickService = function pickService() {
        if (this.isLocked()) return;

        var activity = 'serviceProfessionalService/' + this.item().jobTitleID() + '/client/' + this.item().clientUserID();
        editFieldOn(activity, {
            selectPricing: true,
            selectedServices: this.item().pricing()
            .map(function(pricing) {
                return {
                    serviceProfessionalServiceID: ko.unwrap(pricing.serviceProfessionalServiceID),
                    price: ko.unwrap(pricing.price)
                };
            })
        });
    }.bind(this);

    this.changePrice = function changePrice() {
        if (this.isLocked()) return;
        // TODO
    }.bind(this);

    this.pickLocation = function pickLocation() {
        if (this.isLocked()) return;

        editFieldOn('serviceAddresses/' + this.item().jobTitleID(), {
            selectAddress: true,
            selectedAddressID: this.item().address() ? this.item().address().addressID() : 0,
            clientUserID: this.item().clientUserID()
        });
    }.bind(this);

    var textFieldsHeaders = {
        preNotesToClient: 'Notes to client',
        postNotesToClient: 'Notes to client (afterwards)',
        preNotesToSelf: 'Notes to self',
        postNotesToSelf: 'Booking summary',
        summary: 'What?'
    };

    this.editTextField = function editTextField(field) {
        if (this.isLocked()) return;

        showTextEditor({
            title: textFieldsHeaders[field],
            text: this.item()[field]()
        })
        .then(function(text) {
            this.item()[field](text);
        }.bind(this))
        .catch(function(err) {
            if (err) {
                showError({ error: err });
            }
            // No error, do nothing just was dismissed
        });
    }.bind(this);

    // pass this ready model view as an API to the outside
    if (typeof(params.api) === 'function') {
        params.api(this);
    }

    // Calculate the endTime given an appointment duration, retrieved
    // from the selected service
    ko.computed(function calculateEndTime() {
        var duration = this.item().serviceDurationMinutes();
        var start = moment(this.item().startTime());
        var end;

        if (this.isBooking() &&
            start.isValid()) {
            end = start.add(duration, 'minutes').toDate();
            this.item().endTime(end);
        }
    }, this)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
}

// Modifies prototype. Call prior adding prototype functions.
ComponentViewModel._inherits(EventEmitter);

/**
    It manages incoming data provided by external activities given
    the requestData received by the activity hosting this view instance.
    Used to manage the data returned by calls to edit data in
    external activities.
**/
ComponentViewModel.prototype.passIn = function passIn(requestData) {
    /* eslint complexity:"off", max-statements:"off" */

    // on init
    paymentAccount.sync();

    // If the request includes an appointment plain object, that's an
    // in-editing appointment so put it in place (to restore a previous edition)
    if (requestData.appointment) {
        // Set the edit mode (it performs any required
        // set-up if we are not still in edit mode).
        this.editMode(true);
        // Sets the data
        this.item()
        .model.updateWith(requestData.appointment);
    }
    else if (!this.isNew()) {
        // On any other case, and to prevent a bad editMode state,
        // set off edit mode discarding unsaved data:
        this.cancel();
    }

    // Reset booking request option
    this.selectedRequestDateType('');

    /// Manage specific single data from externally provided

    if (requestData.selectClient === true) {
        this.item().clientUserID(requestData.selectedClientID);
    }
    if (typeof(requestData.selectedDatetime) !== 'undefined') {
        var field = requestData.datetimeField;
        this.item()[field](requestData.selectedDatetime);
        this.allowBookUnavailableTime(requestData.allowBookUnavailableTime);
    }
    if (requestData.selectedJobTitleID) {
        this.item().jobTitleID(requestData.selectedJobTitleID);
    }
    if (requestData.selectAddress === true) {
        if (!this.item().address()) {
            this.item().address(new Address());
        }
        if (requestData.address)
            this.item().address().model.updateWith(requestData.address, true);
        else if (requestData.selectedAddressID)
            this.item().address().addressID(requestData.selectedAddressID);
    }
    if (requestData.selectPricing === true) {
        this.item().pricing(
            requestData.selectedServices.map(function(pricing) {
                return new PricingSummaryDetail(pricing);
            })
        );
    }

    if (this.isNew()) {
        if (requestData && requestData.cancelLink) {
            this.cancelLink = requestData.cancelLink;
        }
        else {
            // Using the Referrer URL as the link when cancelling the task
            var referrerUrl = this.app.shell.referrerRoute;
            referrerUrl = referrerUrl && referrerUrl.url || 'calendar';

            this.cancelLink = referrerUrl;
        }
    }

    // Special behavior for adding a booking: it requires a guided creation
    // through a progress path
    if (this.currentID() === Appointment.specialIds.newBooking) {
        if (!requestData.progress) {
            // Start!
            this.progress = {
                step: 1,
                total: 4,
                ended: false
            };
            // First step
            this.pickClient(); //._delayed(50)();
        }
        else if (requestData.progress) {
            this.progress = requestData.progress;
            var step = this.progress.step || 1;
            if (step < 2) {
                // Second step
                this.progress.step = 2;
                this.pickService();//._delayed(50)();
            }
            else if (step < 3) {
                // Thrid step
                requestData.progress.step = 3;
                this.pickDateTime();//._delayed(50)();
            }
            else if (step < 4) {
                requestData.progress.step = 4;
                this.pickLocation();//._delayed(50)();
            }
            else {
                // Steps finished, not it enters in revision mode before
                // finally save/create the booking, but remove the progress info
                // to avoid problems editing fields.
                this.progress.ended = true;
            }
        }
    } else {
        // Reset progress
        this.progress = null;
    }
};

ko.components.register(TAG_NAME, {
    template: template,
    viewModel: ComponentViewModel
});
