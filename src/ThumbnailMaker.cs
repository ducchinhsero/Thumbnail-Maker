// Thumbnail Maker — native Windows host (WebView2 shell)
// Built for .NET Framework 4.8 with csc (C# 5 language level).

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace ThumbnailMaker
{
    internal static class Program
    {
        internal const string AppName = "Thumbnail Maker";
        internal const string VirtualHost = "app.local";
        internal const string AppUserModelId = "Anphabe.ThumbnailMaker";

        [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
        private static extern int SetCurrentProcessExplicitAppUserModelID(string appId);

        internal static string DataDir
        {
            get
            {
                string dir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "ThumbnailMaker");
                Directory.CreateDirectory(dir);
                return dir;
            }
        }

        [STAThread]
        private static void Main(string[] args)
        {
            bool dev = false;
            for (int i = 0; i < args.Length; i++)
            {
                if (string.Equals(args[i], "--dev", StringComparison.OrdinalIgnoreCase)) dev = true;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Log.Write("host: process start");
            try { SetCurrentProcessExplicitAppUserModelID(AppUserModelId); }
            catch { }
            try
            {
                Application.Run(new MainForm(dev));
            }
            catch (Exception ex)
            {
                Log.Fatal(ex);
                MessageBox.Show(
                    "Không khởi động được Thumbnail Maker.\r\n\r\n" + ex.Message +
                    "\r\n\r\nChi tiết: " + Log.Path,
                    AppName, MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }

    internal static class Log
    {
        internal static readonly string Path = System.IO.Path.Combine(Program.DataDir, "app.log");

        internal static void Write(string message)
        {
            try
            {
                if (File.Exists(Path) && new FileInfo(Path).Length > 512 * 1024)
                {
                    File.Delete(Path);
                }
                File.AppendAllText(Path,
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff", CultureInfo.InvariantCulture) +
                    "  " + message + Environment.NewLine, Encoding.UTF8);
            }
            catch
            {
                // logging must never break the app
            }
        }

        internal static void Fatal(Exception ex)
        {
            Write("FATAL " + ex);
        }
    }

    internal sealed class MainForm : Form
    {
        private const int DWMWA_USE_IMMERSIVE_DARK_MODE = 20;
        private const int DWMWA_WINDOW_CORNER_PREFERENCE = 33;
        private const int DWMWCP_ROUND = 2;

        private readonly bool _devMode;
        private WebView2 _web;
        private string _lastDir;
        private bool _ready;

        [DllImport("dwmapi.dll")]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int value, int size);

        internal MainForm(bool devMode)
        {
            _devMode = devMode;

            SuspendLayout();
            Text = Program.AppName;
            AutoScaleMode = AutoScaleMode.None;
            StartPosition = FormStartPosition.CenterScreen;
            ClientSize = new Size(1360, 840);
            MinimumSize = new Size(1080, 700);
            BackColor = Color.FromArgb(14, 16, 20);
            ForeColor = Color.White;
            DoubleBuffered = true;
            AllowDrop = false;
            KeyPreview = true;
            try
            {
                Icon = LoadEmbeddedIcon();
            }
            catch
            {
                // icon is cosmetic
            }

            _web = new WebView2();
            _web.Dock = DockStyle.Fill;
            _web.BackColor = Color.FromArgb(14, 16, 20);
            _web.DefaultBackgroundColor = Color.FromArgb(255, 14, 16, 20);
            Controls.Add(_web);
            ResumeLayout(false);

            Load += new EventHandler(OnLoad);
            _lastDir = LoadLastDir();
            RestoreWindowPlacement();
        }

        private void RestoreWindowPlacement()
        {
            try
            {
                string raw = Setting("windowBounds", null);
                if (string.IsNullOrEmpty(raw)) return;
                string[] p = raw.Split(',');
                if (p.Length != 4) return;
                int x, y, w, h;
                if (!int.TryParse(p[0], out x) || !int.TryParse(p[1], out y) ||
                    !int.TryParse(p[2], out w) || !int.TryParse(p[3], out h)) return;
                if (w < 400 || h < 300) return;
                Rectangle r = new Rectangle(x, y, w, h);
                bool onScreen = false;
                for (int i = 0; i < Screen.AllScreens.Length; i++)
                {
                    if (Screen.AllScreens[i].WorkingArea.IntersectsWith(r)) { onScreen = true; break; }
                }
                if (!onScreen) return;
                StartPosition = FormStartPosition.Manual;
                Bounds = r;
                if (Setting("windowMaximized", "0") == "1") WindowState = FormWindowState.Maximized;
            }
            catch { }
        }

        private static Icon LoadEmbeddedIcon()
        {
            Stream s = Assembly.GetExecutingAssembly().GetManifestResourceStream("app.ico");
            if (s == null) return null;
            return new Icon(s);
        }

        private static string SettingsFile
        {
            get { return Path.Combine(Program.DataDir, "settings.ini"); }
        }

        private static readonly Dictionary<string, string> Settings = LoadSettingsFile();

        private static Dictionary<string, string> LoadSettingsFile()
        {
            Dictionary<string, string> map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            try
            {
                if (File.Exists(SettingsFile))
                {
                    string[] lines = File.ReadAllLines(SettingsFile);
                    for (int i = 0; i < lines.Length; i++)
                    {
                        int eq = lines[i].IndexOf('=');
                        if (eq > 0) map[lines[i].Substring(0, eq)] = lines[i].Substring(eq + 1);
                    }
                }
            }
            catch { }
            return map;
        }

        internal static string Setting(string key, string fallback)
        {
            string v;
            return Settings.TryGetValue(key, out v) ? v : fallback;
        }

        internal static void StoreSetting(string key, string value)
        {
            Settings[key] = value;
            try
            {
                StringBuilder sb = new StringBuilder();
                foreach (KeyValuePair<string, string> kv in Settings)
                {
                    sb.Append(kv.Key).Append('=').Append(kv.Value).Append(Environment.NewLine);
                }
                File.WriteAllText(SettingsFile, sb.ToString(), Encoding.UTF8);
            }
            catch { }
        }

        private static string LoadLastDir()
        {
            string dir = Setting("lastDir", null);
            if (!string.IsNullOrEmpty(dir) && Directory.Exists(dir)) return dir;
            string pics = Environment.GetFolderPath(Environment.SpecialFolder.MyPictures);
            return Directory.Exists(pics) ? pics : Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        }

        private void SaveLastDir(string dir)
        {
            _lastDir = dir;
            StoreSetting("lastDir", dir);
        }

        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            try
            {
                int on = 1;
                DwmSetWindowAttribute(Handle, DWMWA_USE_IMMERSIVE_DARK_MODE, ref on, sizeof(int));
                int round = DWMWCP_ROUND;
                DwmSetWindowAttribute(Handle, DWMWA_WINDOW_CORNER_PREFERENCE, ref round, sizeof(int));
            }
            catch { }
        }

        private async void OnLoad(object sender, EventArgs e)
        {
            try
            {
                Log.Write("host: Load fired");
                string userData = Path.Combine(Program.DataDir, "WebView2");
                Directory.CreateDirectory(userData);

                string browserArgs = "--disable-features=CalculateNativeWinOcclusion --autoplay-policy=no-user-gesture-required"
                    + " --proxy-server=\"direct://\" --proxy-bypass-list=*"
                    + " --host-resolver-rules=\"MAP app.local 127.0.0.1\""
                    + " --disable-background-networking --disable-component-update --no-first-run"
                    + " --disable-sync --disable-breakpad --no-default-browser-check";
                if (_devMode)
                {
                    browserArgs += " --remote-debugging-port=9333 --remote-allow-origins=*";
                }
                CoreWebView2EnvironmentOptions options = new CoreWebView2EnvironmentOptions(browserArgs);
                CoreWebView2Environment env = await CoreWebView2Environment.CreateAsync(null, userData, options);
                Log.Write("host: env ready");
                await _web.EnsureCoreWebView2Async(env);
                Log.Write("host: core ready");

                CoreWebView2 core = _web.CoreWebView2;
                core.Settings.AreDevToolsEnabled = _devMode;
                core.Settings.AreDefaultContextMenusEnabled = _devMode;
                core.Settings.IsStatusBarEnabled = false;
                core.Settings.IsZoomControlEnabled = false;
                core.Settings.IsPasswordAutosaveEnabled = false;
                core.Settings.IsGeneralAutofillEnabled = false;
                core.Settings.AreBrowserAcceleratorKeysEnabled = _devMode;

                core.AddWebResourceRequestedFilter("https://" + Program.VirtualHost + "/*",
                    CoreWebView2WebResourceContext.All);
                core.WebResourceRequested += OnWebResourceRequested;
                core.WebMessageReceived += OnWebMessageReceived;
                core.NavigationStarting += delegate { _ready = false; };
                core.NavigationCompleted += delegate(object s, CoreWebView2NavigationCompletedEventArgs a)
                {
                    Log.Write("host: navigation completed ok=" + a.IsSuccess + " err=" + a.WebErrorStatus);
                };
                core.DOMContentLoaded += delegate
                {
                    _ready = true;
                };
                core.ProcessFailed += delegate(object s, CoreWebView2ProcessFailedEventArgs a)
                {
                    Log.Write("PROCESS FAILED: " + a.ProcessFailedKind);
                };

                core.Navigate("https://" + Program.VirtualHost + "/index.html");
            }
            catch (Exception ex)
            {
                Log.Fatal(ex);
                MessageBox.Show(this,
                    "Không khởi tạo được WebView2.\r\n\r\n" + ex.Message,
                    Program.AppName, MessageBoxButtons.OK, MessageBoxIcon.Error);
                Close();
            }
        }

        // Serve the embedded UI straight out of the assembly: no external files, no disk I/O.
        private void OnWebResourceRequested(object sender, CoreWebView2WebResourceRequestedEventArgs e)
        {
            string path = "/index.html";
            try
            {
                Uri uri = new Uri(e.Request.Uri);
                path = uri.AbsolutePath;
                if (string.IsNullOrEmpty(path) || path == "/") path = "/index.html";
            }
            catch { }

            string name = path.TrimStart('/').ToLowerInvariant();
            string mime = "application/octet-stream";
            if (name.EndsWith(".html")) mime = "text/html; charset=utf-8";
            else if (name.EndsWith(".js")) mime = "text/javascript; charset=utf-8";
            else if (name.EndsWith(".css")) mime = "text/css; charset=utf-8";
            else if (name.EndsWith(".svg")) mime = "image/svg+xml";
            else if (name.EndsWith(".png")) mime = "image/png";

            Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("ui." + name);
            if (stream == null)
            {
                MemoryStream notFound = new MemoryStream(Encoding.UTF8.GetBytes("Not found: " + name));
                e.Response = _web.CoreWebView2.Environment.CreateWebResourceResponse(
                    notFound, 404, "Not Found", "Content-Type: text/plain");
                return;
            }
            e.Response = _web.CoreWebView2.Environment.CreateWebResourceResponse(
                stream, 200, "OK", "Content-Type: " + mime + "\r\nCache-Control: no-store");
        }

        private void Reply(string json)
        {
            try
            {
                if (_web.CoreWebView2 != null) _web.CoreWebView2.PostWebMessageAsString(json);
            }
            catch (Exception ex)
            {
                Log.Write("reply failed: " + ex.Message);
            }
        }

        private static string Json(bool ok, string extra)
        {
            string s = "{\"ok\":" + (ok ? "true" : "false");
            if (!string.IsNullOrEmpty(extra)) s += "," + extra;
            return s + "}";
        }

        private void OnWebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            string raw;
            try
            {
                raw = e.TryGetWebMessageAsString();
            }
            catch
            {
                return;
            }
            if (string.IsNullOrEmpty(raw)) return;

            Dictionary<string, object> msg;
            try
            {
                msg = new JavaScriptSerializer { MaxJsonLength = int.MaxValue }
                    .Deserialize<Dictionary<string, object>>(raw);
            }
            catch (Exception ex)
            {
                Log.Write("bad message: " + ex.Message);
                return;
            }
            if (msg == null) return;

            string type = Str(msg, "type");
            try
            {
                if (type == "save") HandleSave(msg);
                else if (type == "saveTo") HandleSaveTo(msg);
                else if (type == "reveal") HandleReveal(msg);
                else if (type == "log") Log.Write("UI " + Str(msg, "level") + ": " + Str(msg, "text"));
                else if (type == "ready") Log.Write("UI ready");
                else if (type == "title") Text = Str(msg, "text");
            }
            catch (Exception ex)
            {
                Log.Fatal(ex);
                Reply(Json(false, "\"error\":" + Quote(ex.Message)));
            }
        }

        private static string Str(Dictionary<string, object> m, string key)
        {
            object v;
            if (m.TryGetValue(key, out v) && v != null) return Convert.ToString(v, CultureInfo.InvariantCulture);
            return "";
        }

        private static string Quote(string s)
        {
            return new JavaScriptSerializer().Serialize(s ?? "");
        }

        private void HandleSave(Dictionary<string, object> msg)
        {
            string b64 = Str(msg, "data");
            string suggested = Str(msg, "name");
            string mime = Str(msg, "mime");
            if (b64.Length == 0)
            {
                Reply(Json(false, "\"error\":\"empty\"" ));
                return;
            }
            if (string.IsNullOrEmpty(suggested)) suggested = "thumbnail";
            if (string.IsNullOrEmpty(mime)) mime = "image/png";

            byte[] bytes = Convert.FromBase64String(b64);

            string ext = ".png";
            string filter = "PNG (*.png)|*.png|Tất cả file (*.*)|*.*";
            int index = 1;
            if (mime == "image/jpeg") { ext = ".jpg"; filter = "JPEG (*.jpg)|*.jpg|Tất cả file (*.*)|*.*"; }
            else if (mime == "image/webp") { ext = ".webp"; filter = "WebP (*.webp)|*.webp|Tất cả file (*.*)|*.*"; }

            string fileName = suggested;
            if (!fileName.EndsWith(ext, StringComparison.OrdinalIgnoreCase)) fileName += ext;
            fileName = SafeFileName(fileName);

            using (SaveFileDialog dlg = new SaveFileDialog())
            {
                dlg.Title = "Lưu thumbnail";
                dlg.Filter = filter;
                dlg.FilterIndex = index;
                dlg.FileName = fileName;
                dlg.InitialDirectory = _lastDir;
                dlg.AddExtension = true;
                dlg.OverwritePrompt = true;
                dlg.RestoreDirectory = false;

                if (dlg.ShowDialog(this) != DialogResult.OK)
                {
                    Reply(Json(false, "\"canceled\":true"));
                    return;
                }

                string target = dlg.FileName;
                File.WriteAllBytes(target, bytes);
                SaveLastDir(Path.GetDirectoryName(target));
                Log.Write("saved " + target + " (" + bytes.Length + " bytes)");
                Reply(Json(true, "\"path\":" + Quote(target) + ",\"bytes\":" + bytes.Length));
            }
        }

        // Chỉ dùng khi chạy --dev: ghi thẳng ra đường dẫn (bỏ qua hộp thoại) để kiểm thử tự động.
        private void HandleSaveTo(Dictionary<string, object> msg)
        {
            if (!_devMode) { Reply(Json(false, "\"error\":\"dev only\"")); return; }
            string target = Str(msg, "path");
            string b64 = Str(msg, "data");
            if (target.Length == 0 || b64.Length == 0) { Reply(Json(false, "\"error\":\"empty\"")); return; }
            byte[] bytes = Convert.FromBase64String(b64);
            string dir = Path.GetDirectoryName(target);
            if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
            File.WriteAllBytes(target, bytes);
            Log.Write("saved(dev) " + target + " (" + bytes.Length + " bytes)");
            Reply(Json(true, "\"path\":" + Quote(target) + ",\"bytes\":" + bytes.Length));
        }

        private void HandleReveal(Dictionary<string, object> msg)
        {
            string path = Str(msg, "path");
            if (string.IsNullOrEmpty(path)) return;
            if (File.Exists(path))
            {
                Process.Start("explorer.exe", "/select,\"" + path + "\"");
            }
            else if (Directory.Exists(path))
            {
                Process.Start("explorer.exe", "\"" + path + "\"");
            }
        }

        private static string SafeFileName(string name)
        {
            char[] bad = Path.GetInvalidFileNameChars();
            StringBuilder sb = new StringBuilder(name.Length);
            for (int i = 0; i < name.Length; i++)
            {
                char c = name[i];
                bool isBad = false;
                for (int b = 0; b < bad.Length; b++)
                {
                    if (bad[b] == c) { isBad = true; break; }
                }
                sb.Append(isBad ? '-' : c);
            }
            string result = sb.ToString().Trim();
            return result.Length == 0 ? "thumbnail.png" : result;
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            try
            {
                Rectangle b = (WindowState == FormWindowState.Normal) ? Bounds : RestoreBounds;
                StoreSetting("windowBounds", b.X + "," + b.Y + "," + b.Width + "," + b.Height);
                StoreSetting("windowMaximized", WindowState == FormWindowState.Maximized ? "1" : "0");
            }
            catch { }
            try
            {
                if (_web != null) _web.Dispose();
            }
            catch { }
            base.OnFormClosing(e);
        }

        protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
        {
            if (_ready && keyData == (Keys.Control | Keys.Oemplus))
            {
                // reserved for future use
                return false;
            }
            return base.ProcessCmdKey(ref msg, keyData);
        }
    }
}
