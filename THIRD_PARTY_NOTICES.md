# Third-party notices

The project's source-visible, all-rights-reserved notice does not replace or restrict third-party licenses.

## Microsoft.Web.WebView2 SDK

The build downloads NuGet package **Microsoft.Web.WebView2 1.0.3240.44**. Distributed application files include:

- `Microsoft.Web.WebView2.Core.dll`
- `Microsoft.Web.WebView2.WinForms.dll`
- `WebView2Loader.dll` (win-x64)

The following texts are copied without translation or modification from that package:

- [Package LICENSE.txt](licenses/Microsoft.Web.WebView2-LICENSE.txt)
- [Package NOTICE.txt](licenses/Microsoft.Web.WebView2-NOTICE.txt)

Include these texts with binary distributions. When changing SDK versions, update them from the actual package used. The package notice identifies additional third-party material; preserving it does not imply the application directly uses every listed library.

Source: [NuGet Microsoft.Web.WebView2 1.0.3240.44](https://www.nuget.org/packages/Microsoft.Web.WebView2/1.0.3240.44).

## Prerequisites and development tools

.NET Framework and Microsoft Edge WebView2 Runtime are separate system prerequisites under their respective Microsoft terms; they are not included in the four-file application output. Git, Node.js, Python and Pillow are development/test tools, not bundled by the current build. Redistributing these separately requires reviewing their own terms.

The current UI uses project HTML/CSS/JavaScript, inline SVG and local Canvas processing without an external JavaScript dependency. This inventory describes the current repository and build output, not a legal certification or review of future dependencies.
