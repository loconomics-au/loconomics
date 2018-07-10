﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Ressources for common texts
/// </summary>
public static class LcRessources
{
    public const string ValidationSummaryTitle = "[[[Please fix these issues and try again:]]]";
    public const string DataSaved = "[[[Great work!]]]";
    public const string OK = "[[[OK]]]";
    public const string ShortDataSaved = "[[[Saved]]]";
    public const string RequestSent = "[[[Request sent!]]]";
    public const string MessageSent = "[[[Message was sent]]]";
    public const string FieldXIsRequired = "[[[%0 is required|||{0}]]]";
    public const string InvalidValueForField = "[[[%0 has a not valid value|||{0}]]]";
    public const string MoneySymbolPrefix = "$"; // For Spain: ""
    public const string MoneySymbolSufix = ""; // For Spain: "€"

    private static Dictionary<string, string> textress = new Dictionary<string,string>(){
         { "messaging-message-type-title-inquiry", "Inquiry" }
        ,{ "messaging-message-type-title-marketing", "Marketing" }
        ,{ "messaging-message-type-title-booking-dispute", "Booking Dispute" }
        ,{ "messaging-message-type-title-booking-dispute-resolution", "Booking Dispute Resolution" }
        ,{ "messaging-message-type-title-booking-review", "Booking Review" }
        ,{ "messaging-message-type-title-bookingrequest", "Booking Request" }
        ,{ "messaging-message-type-title-bookingrequest-confirmation", "Booking Request Confirmation" }
        ,{ "messaging-message-type-title-bookingrequest-denegation", "Booking Request Denegation" }
        ,{ "messaging-message-type-title-booking", "Booking" }

        ,{ "Experience Level", "Experience Level" }
        ,{ "Experience Level Description", "" }
        ,{ "Language Level", "Language Level" }
        ,{ "Language Level Description", "" }

        ,{ "postal-code-validation-error", "Zip code is not valid" }
        ,{ "quit-without-save", "You will lose changes if you continue, are you sure?" }
        ,{ "an-error", "There was an error: {0}" }
        ,{ "changes-not-saved", "You made changes but forgot to save!" }
        ,{ "tab-has-changes-stay-on", "Go back" }
        ,{ "tab-has-changes-continue-without-change", "Continue anyway" }

        ,{ "DataSavedAndPositionEnabled", "Congratulations, your {0} profile is now active and can be viewed publicly! <a href='{1}'>View it here</a>" }

        ,{ "PositionActivationProgress", "You've completed {0} out of {1} steps to activate your {2} profile." }
        ,{ "PositionActivationComplete", "Your {0} profile is now public." }
    };
    public static string GetText(string key) {
        if (textress.ContainsKey(key))
            return textress[key];
        return key;
    }
    public static string GetText(string key, params object[] values) {
        return String.Format(GetText(key), values);
    }
    public static string RequiredField(string fieldLabel) {
        return String.Format(FieldXIsRequired, fieldLabel.Capitalize());
    }
    public static string InvalidFieldValue(string fieldLabel)
    {
        return String.Format(InvalidValueForField, fieldLabel.Capitalize());
    }
    #region Dates, time, calendaring
    //TODO i18n 
    public class DayOfWeekRecord
    {
        public int ID;
        public string Name;
        public string Abbr;
    }
    public static IEnumerable<DayOfWeekRecord> ListWeekDays()
    {
        yield return new DayOfWeekRecord{
            ID = (int)DayOfWeek.Sunday,
            Name = DayOfWeek.Sunday.ToString(),
            Abbr = "S"
        };
        yield return new DayOfWeekRecord{
            ID = (int)DayOfWeek.Monday,
            Name = DayOfWeek.Monday.ToString(),
            Abbr = "M"
        };
        yield return new DayOfWeekRecord{
            ID = (int)DayOfWeek.Tuesday,
            Name = DayOfWeek.Tuesday.ToString(),
            Abbr = "T"
        };
        yield return new DayOfWeekRecord{
            ID = (int)DayOfWeek.Wednesday,
            Name = DayOfWeek.Wednesday.ToString(),
            Abbr = "W"
        };
        yield return new DayOfWeekRecord{
            ID = (int)DayOfWeek.Thursday,
            Name = DayOfWeek.Thursday.ToString(),
            Abbr = "T"
        };
        yield return new DayOfWeekRecord{
            ID = (int)DayOfWeek.Friday,
            Name = DayOfWeek.Friday.ToString(),
            Abbr = "F"
        };
        yield return new DayOfWeekRecord{
            ID = (int)DayOfWeek.Saturday,
            Name = DayOfWeek.Saturday.ToString(),
            Abbr = "S"
        };
    }
    #endregion
}