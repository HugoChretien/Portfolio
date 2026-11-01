param(
  [int]$Port = 4180
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath $PSScriptRoot).Path

$serverSource = @'
using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

public static class PortfolioServer
{
    private static string root;

    public static void Start(string siteRoot, int port)
    {
        root = Path.GetFullPath(siteRoot);
        var listener = new TcpListener(IPAddress.Loopback, port);
        listener.Server.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
        listener.Start();

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("Portfolio disponible sur http://localhost:" + port);
        Console.ResetColor();
        Console.WriteLine("Appuyez sur Ctrl+C pour arrêter le serveur.");

        try
        {
            while (true)
            {
                var client = listener.AcceptTcpClient();
                ThreadPool.QueueUserWorkItem(HandleClientObject, client);
            }
        }
        finally
        {
            listener.Stop();
        }
    }

    private static void HandleClientObject(object state)
    {
        HandleClient((TcpClient)state);
    }

    private static void HandleClient(TcpClient client)
    {
        client.LingerState = new LingerOption(true, 2);
        client.NoDelay = true;
        using (client)
        using (var stream = client.GetStream())
        using (var reader = new StreamReader(stream, Encoding.ASCII, false, 1024, true))
        {
            try
            {
                client.ReceiveTimeout = 5000;
                var requestLine = reader.ReadLine();
                string header;
                do { header = reader.ReadLine(); } while (!String.IsNullOrEmpty(header));

                if (String.IsNullOrEmpty(requestLine)) return;
                var parts = requestLine.Split(' ');
                if (parts.Length < 2 || (parts[0] != "GET" && parts[0] != "HEAD"))
                {
                    Send(stream, 400, "Bad Request", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("400 — Requête invalide"), false);
                    return;
                }

                var method = parts[0];
                var uri = new Uri("http://localhost" + parts[1]);
                var relative = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/'));
                if (String.IsNullOrWhiteSpace(relative)) relative = "index.html";
                relative = relative.Replace('/', Path.DirectorySeparatorChar);

                var requested = Path.GetFullPath(Path.Combine(root, relative));
                if (!requested.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                {
                    Send(stream, 403, "Forbidden", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("403 — Accès refusé"), method == "HEAD");
                    return;
                }

                if (Directory.Exists(requested)) requested = Path.Combine(requested, "index.html");
                if (!File.Exists(requested))
                {
                    Send(stream, 404, "Not Found", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("404 — Fichier introuvable"), method == "HEAD");
                    return;
                }

                var body = File.ReadAllBytes(requested);
                Send(stream, 200, "OK", GetContentType(Path.GetExtension(requested)), body, method == "HEAD");
            }
            catch (IOException) { }
            catch (SocketException) { }
            catch (Exception exception)
            {
                try
                {
                    Send(stream, 500, "Internal Server Error", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes(exception.Message), false);
                }
                catch { }
            }
        }
    }

    private static void Send(Stream stream, int code, string status, string contentType, byte[] body, bool headersOnly)
    {
        var headers = "HTTP/1.1 " + code + " " + status + "\r\n" +
                      "Content-Type: " + contentType + "\r\n" +
                      "Content-Length: " + body.Length + "\r\n" +
                      "Connection: close\r\n" +
                      "Cache-Control: no-cache\r\n\r\n";
        var headerBytes = Encoding.ASCII.GetBytes(headers);
        stream.Write(headerBytes, 0, headerBytes.Length);
        if (!headersOnly && body.Length > 0) stream.Write(body, 0, body.Length);
        stream.Flush();
    }

    private static string GetContentType(string extension)
    {
        switch ((extension ?? "").ToLowerInvariant())
        {
            case ".html": return "text/html; charset=utf-8";
            case ".css": return "text/css; charset=utf-8";
            case ".js": return "application/javascript; charset=utf-8";
            case ".json": return "application/json; charset=utf-8";
            case ".png": return "image/png";
            case ".jpg":
            case ".jpeg": return "image/jpeg";
            case ".svg": return "image/svg+xml";
            case ".pdf": return "application/pdf";
            case ".ico": return "image/x-icon";
            default: return "application/octet-stream";
        }
    }
}
'@

Add-Type -TypeDefinition $serverSource -Language CSharp
[PortfolioServer]::Start($root, $Port)
