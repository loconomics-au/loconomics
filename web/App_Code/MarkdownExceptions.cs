using LcMarkdown;
using Markdig;
using Markdig.Extensions.Yaml;
using Markdig.Syntax;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using YamlDotNet.Serialization;

/// <summary>
/// Summary description for MarkdownExceptions
/// </summary>
public static class MarkdownExtensions
{
    private static readonly IDeserializer YamlDeserializer =
        new DeserializerBuilder()
        .IgnoreUnmatchedProperties()
        .Build();

    private static readonly MarkdownPipeline Pipeline
        = new MarkdownPipelineBuilder()
        .UseYamlFrontMatter()
        .Build();

    public static T GetFrontMatter<T>(this string markdown)
    {
        var document = Markdown.Parse(markdown, Pipeline);
        var block = document
            .Descendants<YamlFrontMatterBlock>()
            .FirstOrDefault();


        var yaml = "";
        if (block != null)
        {
            yaml = block
                // this is not a mistake
                // we have to call .Lines 2x
                .Lines // StringLineGroup[]
                .Lines // StringLine[]
                .OrderByDescending(x => x.Line)
                .Select(x => x + "\n")
                .ToList()
                .Select(x => x.Replace("---", string.Empty))
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Aggregate((s, agg) => agg + s);
        }

        return YamlDeserializer.Deserialize<T>(yaml);
    }
}