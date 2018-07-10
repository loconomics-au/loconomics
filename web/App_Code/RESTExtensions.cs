﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;
using System.Web.WebPages.Html;
using System.Web.Helpers;
using WebMatrix.WebData;

/// <summary>
/// Collection of extensions useful for implementation
/// of a RESTful API
/// </summary>
public static class RESTExtensions
{
    public static IEnumerable ErrorsDictionary(this ModelStateDictionary modelState)
    {
        if (!modelState.IsValid)
        {
            return modelState.ToDictionary(kvp => kvp.Key,
                kvp => kvp.Value.Errors
                                .Select(e => e)).ToArray()
                                .Where(m => m.Value.Count() > 0);
        }
        return null;
    }

    public static IEnumerable Errors(this ModelStateDictionary modelState)
    {
        var errors = new Hashtable();
        foreach (var pair in modelState)
        {
            if (pair.Value.Errors.Count > 0)
            {
                errors[pair.Key] = pair.Value.Errors.ToList();
            }
        }
        return errors;
    }

    /// <summary>
    /// For REST pages only.
    /// Requires to be authenticated and be a user of the required type to
    /// gain access to this ressource, otherwise the response ends prematurely
    /// giving information about the REST URLs for log-in, sign-up and the
    /// requiredLevel of the page (user type).
    /// </summary>
    /// <param name="response"></param>
    /// <param name="type"></param>
    public static void RestRequiresUser(this HttpResponseBase response, LcData.UserInfo.UserType type = LcData.UserInfo.UserType.User)
    {
        var info = new
        {
            requiredLevel = type.ToString(),
            login = LcUrl.LangPath + "rest/login",
            signup = LcUrl.LangPath + "rest/signup"
        };

        if (WebMatrix.WebData.WebSecurity.IsAuthenticated)
        {
            if (type.HasFlag(LcData.UserInfo.UserType.LoggedUser))
            {
                // valid
                return;
            }

            var user = LcData.UserInfo.GetUserRow();

            if (// Provider
                type.HasFlag(LcData.UserInfo.UserType.Provider) &&
                user.IsProvider == true ||
                // Admin
                type.HasFlag(LcData.UserInfo.UserType.Admin) &&
                user.IsAdmin == true ||
                type.HasFlag(LcData.UserInfo.UserType.Client) &&
                user.IsCustomer == true)
            {
                // valid
                return;
            }

            // Forbidden
            response.StatusCode = 403;
        }
        else
        {
            // Unauthorized
            response.StatusCode = 401;
        }

        ThrowHttpAuthError(response, info);
    }

    public static void ThrowHttpAuthError(this HttpResponseBase response, dynamic info)
    {
        // IMPORTANT: Ugly Forms Authentication do redirects when a response 401/403 is sent,
        // so it overrides everything sent by the asp.net default behavior of redirect
        // to login pages.
        // Disabling authentication solve it, but too we lost forms authentication and we need it.
        // So, we double override that behavior in global.asax EndRequest
        // showing the expected JSON response by passing it in a header to global.asax,
        // its set in the body and cleared from the header.
        response.AddHeader("REST-Code", response.StatusCode.ToString());
        response.AddHeader("REST", Json.Encode(info));

        // This will work for 403 and when webforms authentication is disabled, otherwise
        // is done twice in global.asax to ensure is sent
        response.ContentType = "application/json";
        Json.Write(info, response.Output);
        response.End();
    }

    public static void RestRequiresPartnerUser(this HttpResponseBase response, string partnerUserType, string partner = null)
    {
        if (!WebSecurity.IsAuthenticated)
        {
            // Unauthorized
            response.StatusCode = 401;
        }
        else
        {
            var user = LcRest.UserProfile.Get(WebSecurity.CurrentUserId);
            var isSystemAdmin = user.isAdmin;
            if (isSystemAdmin)
            {
                // ever valid for system admin
                return;
            }
            if (partner == null || user.partner == partner)
            {
                // valid
                return;
            }
            partner = user.partner;
            if (user.partnerUserType == partnerUserType)
            {
                // valid
                return;
            }
            // Forbidden
            response.StatusCode = 403;
        }
        ThrowHttpAuthError(response, new
        {
            requiredLevel = partner + ":" + partnerUserType,
            login = LcUrl.LangPath + "rest/login",
            signup = LcUrl.LangPath + "rest/signup"
        });
    }

    /// <summary>
    /// For request with data provided as type JSON,
    /// it gets the deserialized JSON object,
    /// or null otherwise.
    /// </summary>
    /// <param name="Request"></param>
    /// <returns></returns>
    public static dynamic GetJsonData(this HttpRequestBase Request, Type type = null)
    {
        // application/json; charset=UTF-8
        if (Request.ContentType.StartsWith("application/json"))
        {
            string json;
            using(var reader = new System.IO.StreamReader(Request.InputStream)){
                json = reader.ReadToEnd();
            }
            // Json.Decode doesn't work as expected with Arrays, getting and empty object instead, 
            // breaking the code.
            //return System.Web.Helpers.Json.Decode(json);
            return Newtonsoft.Json.JsonConvert.DeserializeObject(json, type);
        }
        return null;
    }
}