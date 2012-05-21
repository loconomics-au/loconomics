﻿
/*
 * For Messaging, waiting for loadHashBang to know if we must load
 * an specific message thread at page loading
 */
$(document).bind('loadHashBang', function (event, hashbangvalue) {
    var urlParameters = getHashBangParameters(hashbangvalue);
    // Analize parameters values
    if (urlParameters.Thread) {
        openMessageThreadInTab(urlParameters.Thread, "Message Thread " + urlParameters.Thread, urlParameters.Message);
    }
    if (urlParameters.BookingRequest) {
        openBookingInTab(urlParameters.BookingRequest, urlParameters.Booking,
            "Booking Request " + urlParameters.BookingRequest);
    } else if (urlParameters.Booking) {
        openBookingInTab(0, urlParameters.Booking,
            "Booking " + urlParameters.Booking, ('Review' in urlParameters));
    }
});

$(document).ready(function () {
    /*
    * Change Photo
    */
    $('#changephoto').click(function () {
        popup(UrlUtil.LangPath + 'Dashboard/ChangePhoto/', 'small');
    });

    /*
    * Booking list actions
    */
    $('body').delegate('.bookings-list .actions .item-action', 'click', function () {
        var $t = $(this);
        openBookingInTab(
            $t.data('booking-request-id'),
            $t.data('booking-id'),
            $t.closest('.bookings-list').find('.user-public-name:eq(0)').text()
        );
    });

    /*
    * Booking Request confirmation
    */
    $('body').delegate('.booking-request-action', 'click', function () {
        var brId = $(this).data('booking-request-id');
        var $tab = $(this).closest('.tab-body');
        var options = { autoUnblockLoading: true };
        var data = { BookingRequestID: brId };
        var $t = $(this);
        var url;
        if ($t.hasClass('button-confirm-datetime')) {
            data.ConfirmedDateType = $(this).data('date-type');
            url = 'Booking/$ConfirmBookingRequest/';
        } else if ($t.hasClass('button-decline-booking')) {
            url = 'Booking/$DeclineBookingRequest/';
        } else if ($t.hasClass('button-cancel-booking')) {
            url = 'Booking/$CancelBookingRequest/';
        } else {
            // Bad handler:
            return;
        }

        // Loading, with retard
        var loadingtimer = setTimeout(function () {
            $tab.block(loadingBlock);
        }, gLoadingRetard);

        // Do the Ajax post
        $.ajax({
            url: UrlUtil.LangPath + url,
            data: data,
            success: function (data, text, jx) {
                if (!dashboardGeneralJsonCodeHandler(data, $tab, options)) {
                    // Unknowed sucessfull code (if this happen in production there is a bug!)
                    alert("Result Code: " + data.Code);
                }
                // Some list updates
                // After update request, bookings-list tab need be reloaded
                $('#bookings-all').reload();
                // After update request, state changed, new message created, reload thread list to reflect it
                $('#inbox').reload();
            },
            error: ajaxErrorPopupHandler,
            complete: function () {
                // Disable loading
                clearTimeout(loadingtimer);
                // Unblock
                if (options.autoUnblockLoading) {
                    $tab.unblock();
                }
            }
        });
    })
    .delegate('.review-booking-action', 'click', function () {
        var $t = $(this);
        openBookingInTab(
            0,
            $t.data('booking-id'),
            $t.closest('.booking').find('.user-public-name:eq(0)').text(),
            true
        );
    })
    .delegate('.booking-review .open-booking-action', 'click', function () {
        var $t = $(this);
        openBookingInTab(
            0,
            $t.data('booking-id'),
            $t.closest('.booking-review').find('.user-public-name:eq(0)').text()
        );
    });


    /*=========
    * Messaging
    */
    $('body').delegate('.message-thread-list .actions .item-action', 'click', function () {
        var $t = $(this);
        var auxT = $t.data('message-aux-t');
        var auxID = $t.data('message-aux-id');
        if ((auxT == "Booking" || auxT == "BookingRequest") && auxID) {
            var brID = auxID;
            var bID = 0;
            if (auxT == "Booking") {
                brID = 0;
                bID = auxID;
            }
            openBookingInTab(
                brID,
                bID,
                $t.closest('.items-list').find('.user-public-name:eq(0)').text()
            );
        } else
            openMessageThreadInTab(
                $(this).data('message-thread-id'),
                $(this).closest('.message-thread-list').find('.user-public-name:eq(0)').text());
    })
    .delegate('.conversation-messages > li.new-message textarea', 'focus', function () {
        $(this).animate({ height: 250 });
    });

});

function openBookingInTab(bookingRequestID, bookingID, tabTitle, openReview) {
    var bid = bookingID;
    var brid = bookingRequestID;
    var data = { BookingRequestID: brid };
    var url = "Booking/$BookingRequestDetails/";
    var tabId = 'bookingRequestID' + brid;

    if (bid && bid > 0) {
        url = "Booking/$BookingDetails/";
        data.BookingID = bid;
        tabId += '_bookingID' + bid;

        if (openReview === true) {
            url = "Booking/$BookingReview/";
            tabId += "_Review";
        }
    }

    var tab = TabbedUX.createTab('#main', tabId, tabTitle);
    if (tab) {
        TabbedUX.focusTab(tab);

        var $tab = $(tab);

        // Loading, with retard
        var loadingtimer = setTimeout(function () {
            $tab.block(loadingBlock);
        }, gLoadingRetard);

        // Do the Ajax post
        $.ajax({
            url: UrlUtil.LangPath + url,
            data: data,
            success: function (data, text, jx) {
                if (!dashboardGeneralJsonCodeHandler(data, $tab)) {
                    // Unknowed sucessfull code (if this happen in production there is a bug!)
                    alert("Result Code: " + data.Code);
                }
            },
            error: ajaxErrorPopupHandler,
            complete: function () {
                // Disable loading
                clearTimeout(loadingtimer);
                // Unblock
                $tab.unblock();

                if (!openReview)
                    // Updating the tab title, because when is loaded by URL, the title is the ID,
                    // here is setted something more usable:
                    TabbedUX.setTabTitle($tab, $tab.find('.user-public-name:eq(0)').text());
            }
        });
    } else
    // Tab couln't be created, already must exist, focus it
        TabbedUX.focusTab('#' + tabId);
}
function openMessageThreadInTab(threadId, tabTitle, highlightMessageId) {
    var tid = threadId;
    var data = { MessageThreadID: tid };
    var url = "Messaging/$MessageThread/";
    var tabId = 'messageThreadID-' + tid;

    var tab = TabbedUX.createTab('#main', tabId, tabTitle);
    if (tab) {
        TabbedUX.focusTab(tab);

        var $tab = $(tab);

        // Loading, with retard
        var loadingtimer = setTimeout(function () {
            $tab.block(loadingBlock);
        }, gLoadingRetard);

        // Do the Ajax post
        $.ajax({
            url: UrlUtil.LangPath + url,
            data: data,
            success: function (data, text, jx) {
                if (!dashboardGeneralJsonCodeHandler(data, $tab)) {
                    // Unknowed sucessfull code (if this happen in production there is a bug!)
                    alert("Result Code: " + data.Code);
                }
            },
            error: ajaxErrorPopupHandler,
            complete: function () {
                // Disable loading
                clearTimeout(loadingtimer);
                // Unblock
                $tab.unblock();

                // Updating the tab title, because when is loaded by URL, the title is the ID,
                // here is setted something more usable:
                TabbedUX.setTabTitle($tab, $tab.find('.user-public-name:eq(0)').text());

                if (highlightMessageId) {
                    $tab.find('.message-' + highlightMessageId + ' > .message-section').addClass('highlighted');
                }
            }
        });
    } else {
        // Tab couln't be created, already must exist, focus it
        TabbedUX.focusTab('#' + tabId);
        // Search MessageID to highlight it
        if (highlightMessageId) {
            $('#' + tabId).find('.message-' + highlightMessageId + ' > .message-section').addClass('highlighted');
        }
    }
}

/* Return true for 'handled' and false for 'not handled' (there is a custom data.Code to be managed) */
function dashboardGeneralJsonCodeHandler(data, container, options) {
    if (!container) container = $(document);

    // If is a JSON result:
    if (typeof (data) === 'object') {
        if (data.Code == 0) {
            // Special Code 0: general success code, show message saying that 'all was fine'

            // Unblock loading:
            container.unblock();
            // Block with message:
            var message = data.Result || container.data('success-ajax-message') || 'Confirmed!';
            container.block({
                message: message,
                css: popupStyle(popupSize('small'))
            })
            .click(function () { container.unblock(); });
            // Do not unblock in complete function!
            options.autoUnblockLoading = false;
        } else if (data.Code == 1) {
            // Special Code 1: do a redirect
            window.location = data.Result;
        } else if (data.Code == 2) {
            // Special Code 2: show login popup (with the given url at data.Result)
            container.unblock();
            popup(data.Result, { width: 410, height: 320 });
        } else if (data.Code == 3) {
            // Special Code 3: reload current page content to the given url at data.Result)
            // Note: to reload same url page content, is better return the html directly from
            // this ajax server request.
            //container.unblock(); is blocked and unblocked againg by the reload method:
            options.autoUnblockLoading = false;
            container.reload(data.Result);
        } else if (data.Code > 0) {
            // Not handled!
            return false;
        } else { // data.Code < 0
            // There is an error code.

            // Unblock loading:
            container.unblock();
            // Block with message:
            var message = data.Code + ": " + (data.Result ? data.Result.ErrorMessage ? data.Result.ErrorMessage : data.Result : '');
            container.block({
                message: 'Error: ' + message,
                css: popupStyle(popupSize('small'))
            })
            .click(function () { container.unblock(); });

            // Do not unblock in complete function!
            options.autoUnblockLoading = false;
        }
    } else {
        container.html(data);
    }
    return true;
}