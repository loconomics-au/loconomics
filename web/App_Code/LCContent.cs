using LcMarkdown;
using LcRest;
using Markdig;
using Markdig.Renderers;
using RestSharp;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Web;

/// <summary>
/// Summary description for LcContent
/// </summary>
public class LcContent
{
    public LcContent()
    {
        //
        // TODO: Add constructor logic here
        //
    }

    public IEnumerable<HelpArticle> GetHelpArticleList()
    {
        var pageOwnerRepo = ConfigurationManager.AppSettings["pageOwnerRepo"];
        var client = new RestClient("https://api.github.com");
        var request = new RestRequest("/repos/loconomics-au/coop-website/contents/help/articles/205985385-how-do-i-import-and-sync-my-existing-calendar.md", Method.GET);
        request.RequestFormat = DataFormat.Json;

        var response = client.Execute<HelpPage>(request);

        var content = Base64Decode(response.Data.Content);

        var article = content.GetFrontMatter<HelpArticleFrontMatter>();
        var html = ParseMarkdown(content);
        article.Content = ParseMarkdown(content);

        return new List<HelpArticle>() { new HelpArticle { id = article.Id, user_segment_id = 123, title = article.Title, body = article.Content, section_id = article.SectionId } };        
    }

    public HelpArticle GetHelpArticle(string title)
    {
        var client = new RestClient("https://api.github.com");
        var request = new RestRequest("/repos/loconomics-au/coop-website/contents/help/articles/205985385-how-do-i-import-and-sync-my-existing-calendar.md", Method.GET);
        request.RequestFormat = DataFormat.Json;

        var response = client.Execute<HelpPage>(request);

        var content = Base64Decode(response.Data.Content);

        var article = content.GetFrontMatter<HelpArticleFrontMatter>();
        var html = ParseMarkdown(content);
        article.Content = ParseMarkdown(content);

        return new HelpArticle { id = article.Id, user_segment_id = 123, title = article.Title, body = article.Content, section_id = article.SectionId };

    }

    private string Base64Decode(string base64EncodedData)
    {
        var base64EncodedBytes = System.Convert.FromBase64String(base64EncodedData);
        return System.Text.Encoding.UTF8.GetString(base64EncodedBytes);
    }

    private string ParseMarkdown(string markdown)
    {
        var builder = new MarkdownPipelineBuilder()
            .UseEmphasisExtras()
            .UsePipeTables()
            .UseGridTables()
            .UseFooters()
            .UseFootnotes()
            .UseCitations()
            .UseAutoLinks() // URLs are parsed into anchors
                            //.UseAutoIdentifiers(AutoIdentifierOptions.GitHub) // Headers get id="name" 
            .UseAbbreviations()
            .UseYamlFrontMatter()
            .UseEmojiAndSmiley(true)
            .UseMediaLinks()
            .UseListExtras()
            .UseFigures()
            .UseTaskLists()
            .UseCustomContainers()
            .UseGenericAttributes();
        MarkdownPipeline Pipeline = builder.Build();
        var htmlWriter = new StringWriter();
        var renderer = new HtmlRenderer(htmlWriter);

        Markdown.Convert(markdown, renderer, Pipeline);

        var html = htmlWriter.ToString();

        return html;
    }
    
    public class HelpPage
    {
        public string Name { get; set; }
        public string Content { get; set; }
    }
}