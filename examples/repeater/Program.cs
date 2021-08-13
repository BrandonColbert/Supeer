using System;
using System.Collections.Concurrent;
using System.IO;
using System.Linq;
using System.Net.Sockets;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Threading;

public class Program {
	public abstract class Peer : IDisposable {
		private TcpClient client;
		protected NetworkStream stream;
		protected StreamReader reader;
		protected ConcurrentQueue<string> items;

		public Peer(int port) {
			client = new TcpClient("localhost", port);
			stream = client.GetStream();
			reader = new StreamReader(stream);
			items = new ConcurrentQueue<string>();

			Task.Run(() => {
				while(Connected)
					items.Enqueue(reader.ReadLine());
			});
		}

		public bool Connected => client.Connected;

		public abstract void Check();

		public void Send(string message) {
			var data = System.Text.Encoding.ASCII.GetBytes($"{{\"message\": \"{message}\"}}\n");
			stream.Write(data, 0, data.Length);
		}

		public void Dispose() {
			reader.Close();
			stream.Close();
			client.Close();
		}
	}

	public class Host : Peer {
		public Action<string> onConnect, onDisconnect;
		public Action<string, string> onRecieve;
		
		public Host(int port) : base(port) {}

		// public async Task<int> GetCode() {
			
		// }

		public override void Check() {
			while(!items.IsEmpty && items.TryDequeue(out var result)) {
				onRecieve(null, result);
			}
		}

		public void Send(string message, string[] ids) {
			var data = System.Text.Encoding.ASCII.GetBytes($"{{\"message\": \"{message}\", \"ids\": [{string.Join(",", ids)}]}}\n");
			stream.Write(data, 0, data.Length);
		}
	}

	public static void Main(string[] args) {
		var host = new Host(25560);
		host.onRecieve = (id, message) => Console.WriteLine(message);

		host.Send("Hello");

		while(host.Connected)
			host.Check();
	}
}