﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;
using System.Globalization;
using System.Threading;

/// <summary>
/// LcExtensions is a set of usefull classes extensions to use along all the Loconomics site
/// </summary>
public static class LcExtensions
{
    public static bool IsAjaxRequest(this HttpRequest request)
    {
        if (request == null)
        {
            throw new ArgumentNullException("request");
        }
        return (request["X-Requested-With"] == "XMLHttpRequest") || ((request.Headers != null) && (request.Headers["X-Requested-With"] == "XMLHttpRequest"));
    }
    public static bool IsAjaxRequest(this HttpRequestBase request)
    {
        if (request == null)
        {
            throw new ArgumentNullException("request");
        }
        return (request["X-Requested-With"] == "XMLHttpRequest") || ((request.Headers != null) && (request.Headers["X-Requested-With"] == "XMLHttpRequest"));
    }
    public static Dictionary<string, object> ToJsonDictionary<TKey, TValue>(this Dictionary<TKey, TValue> input)
    {
	    var output = new Dictionary<string, object>(input.Count);
	    foreach (KeyValuePair<TKey, TValue> pair in input)
		    output.Add(pair.Key.ToString(), pair.Value);
	    return output;
        //return input.ToDictionary(item => item.Key.ToString(), item => item.Value);
    }

    public static string Capitalize(this String str)
    {
        if (str == null || str.Length < 1) return str;

        return (
            str[0].ToString().ToUpper() + 
            (str.Length > 1 ? str.Substring(1) : "")
        );
    }
    
    public static string ToTitleCase(this String stringToFormat)
    {
        CultureInfo cultureInfo = Thread.CurrentThread.CurrentCulture;
        TextInfo textInfo = cultureInfo.TextInfo;

        // Check if we have a string to format
        if (String.IsNullOrEmpty(stringToFormat))
        {
            // Return an empty string
            return string.Empty;
        }

        // Format the string to Proper Case
        return textInfo.ToTitleCase(stringToFormat.ToLower());
    }

    /// <summary>
    /// Reduce every duplicated appeareance of white space characters
    /// to a single, standard, space.
    /// </summary>
    /// <param name="str"></param>
    /// <returns></returns>
    public static string CollapseSpaces(this String str)
    {
        if (String.IsNullOrWhiteSpace(str))
            return "";

        var reg = new System.Text.RegularExpressions.Regex(@"\s{2,}");
        return reg.Replace(str, " ");
    }

    public static IEnumerable TopElements(this IEnumerable list, double limit)
    {
        double count = 0;
        foreach (var item in list) {
            if (count++ == limit)
                yield break;
            yield return item;
        }
    }

    public static TimeSpan AsTimeSpan(this String str)
    {
        return str.AsTimeSpan(TimeSpan.Zero);
    }
    public static TimeSpan AsTimeSpan(this String str, TimeSpan defaultValue)
    {
        var r = defaultValue;
        TimeSpan.TryParse(str, out r);
        return r;
    }

    public static string ToPascalCase(this String str)
    {
        if (str == null) return "";
        System.Globalization.TextInfo textInfo = System.Globalization.CultureInfo.CurrentUICulture.TextInfo;
        string result = textInfo.ToTitleCase(str.Trim().Replace("-", " ")).Replace(" ", "");
        return result;
    }
    public static string ToCamelCase(this String str)
    {
        if (str == null) return "";
        var result = str.ToPascalCase();
        if (result.Length > 1)
            result = result[0].ToString().ToLower() + result.Substring(1);
        return result;
    }

    /// <summary>
    /// Get the array slice between the two indexes.
    /// ... Inclusive for start index, exclusive for end index.
    /// </summary>
    public static T[] Slice<T>(this T[] source, int start, int end = 0)
    {
        // Hanldes 'slice to the end'
        if (end == 0)
        {
            end = source.Length - 1;
        }
        // Handles negative ends.
        else if (end < 0)
        {
            end = source.Length + end;
        }
        int len = end - start;

        // Return new array.
        T[] res = new T[len];
        for (int i = 0; i < len; i++)
        {
            res[i] = source[i + start];
        }
        return res;
    }
    public static IEnumerable<T> Slice<T>(this IEnumerable<T> source, int start, int end = 0)
    {
        // If ends is negative, we need to know the total count and discount that
        // amount of last elements
        // Hanldes 'slice to the end'
        if (end < 0)
        {
            end = source.Count() + end;
        }
        int len = end - start;

        // Return new array.
        var i = 0;
        foreach (var r in source)
        {
            if (i < start)
            {
                i++;
                continue;
            }
            else if (end == 0 || i < len)
            {
                yield return r;
                i++;
            }
            else
                yield break;
        }
    }

    public static long AsLong(this string text, long alt = 0)
    {
        long v = 0;
        if (long.TryParse(text, out v))
            return v;
        else
            return alt;
    }

    public static long ToMinorUnit(this decimal priceInMajorUnit, long alt = 0)
    {
        return Convert.ToInt64(priceInMajorUnit * 100);
    }

    public static List<T> Replace<T>(this List<T> list, T lookFor, T replaceWith)
    {
        for (int i = 0, l = list.Count; i < l; i++)
        {
            var item = list[i];
            if (item != null && item.Equals(lookFor) ||
                item == null && lookFor == null)
            {
                // Replace with value
                list[i] = replaceWith;
            }
        }
        // Return the same list for chainability
        return list;
    }
}