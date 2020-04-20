/**
 * Offers several Regular Expressions to validate phone numbers.
 * Only supports North America patterns and a general rule of valid chars for
 * anything else.
 */
'use strict';

/**
 * Matches anything with almost a digit, parenthesis, dash, dot or
 * whitespace
 */
exports.GENERAL_VALID_CHARS = /[\d\(\)\-\.\ ]+/;
/**
 * Matches numbers between 10 to 14 digits using several grouping patterns:
 * - (123) 456-7890  Prefix between parenthesis and dash separator
 * - 123-456-7890    Dash as unique separator
 * - 123.456.7890    Dot as unique separator
 * - 1234567890      Just digits
 */
exports.NORTH_AMERICA_PATTERN = /^\([1-9]\d{2}\)\ \d{3}\-\d{4,8}$|^[1-9]\d{2}\-\d{3}\-\d{4,8}$|^[1-9]\d{2}\.\d{3}\.\d{4,8}$|^[1-9]\d{9,13}$/;
/**
 * Matches most australian numbers
 * +61(02)89876544
 * +61 2 8986 6544
 * 02 8986 6544
 * +61289876544
 * 0414 570776
 * 0414570776
 * 0414 570 776
 * 04 1457 0776
 * +61 414 570776
 * +61 (04)14 570776
 * +61 (04)14-570-776
 *
 * Longest possible match:
 * +61 (04) 12 131 212
 * 
 * Fail cases:
 * +61(0289876544
 * 0414 57 0776
 * 123456789
 * (715) 867-5309
 * +1 661 2019-835
 * Source https://regex101.com/r/dkFASs/6
 */
exports.AUSTRALIA_PATTERN = /^(?:\+?(61))? ?(?:\((?=.*\)))?(0?[2-57-8])\)? ?(\d\d(?:[- ](?=\d{3})|(?!\d\d[- ]?\d[- ]))\d\d[- ]?\d[- ]?\d{3})$/;