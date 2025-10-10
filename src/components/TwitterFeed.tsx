export default function TwitterFeed() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <span>O que está bombando</span>
            <span className="text-3xl">🔥</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline 1: NBA Official */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                @NBA
              </h3>
            </div>
            <iframe
              src="https://syndication.twitter.com/srv/timeline-profile/screen-name/NBA?dnt=false&embedId=twitter-widget-0&features=eyJ0ZndfdGltZWxpbmVfbGlzdCI6eyJidWNrZXQiOltdLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X2ZvbGxvd2VyX2NvdW50X3N1bnNldCI6eyJidWNrZXQiOnRydWUsInZlcnNpb24iOm51bGx9LCJ0ZndfdHdlZXRfZWRpdF9iYWNrZW5kIjp7ImJ1Y2tldCI6Im9uIiwidmVyc2lvbiI6bnVsbH0sInRmd19yZWZzcmNfc2Vzc2lvbiI6eyJidWNrZXQiOiJvbiIsInZlcnNpb24iOm51bGx9LCJ0ZndfZm9zbnJfc29mdF9pbnRlcnZlbnRpb25zX2VuYWJsZWQiOnsiYnVja2V0Ijoib24iLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X21peGVkX21lZGlhXzE1ODk3Ijp7ImJ1Y2tldCI6InRyZWF0bWVudCIsInZlcnNpb24iOm51bGx9LCJ0ZndfZXhwZXJpbWVudHNfY29va2llX2V4cGlyYXRpb24iOnsiYnVja2V0IjoxMjA5NjAwLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X3Nob3dfYmlyZGhkYXkiOnsiYnVja2V0Ijoib24iLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X2R1cGxpY2F0ZV9zY3JpYmVzX3RvX3NldHRpbmdzIjp7ImJ1Y2tldCI6Im9uIiwidmVyc2lvbiI6bnVsbH0sInRmd191c2VfcHJvZmlsZV9pbWFnZV9zaGFwZV9lbmFibGVkIjp7ImJ1Y2tldCI6Im9uIiwidmVyc2lvbiI6bnVsbH0sInRmd192aWRlb19obHNfZHluYW1pY19tYW5pZmVzdHNfMTUwODIiOnsiYnVja2V0IjoidHJ1ZV9iaXRyYXRlIiwidmVyc2lvbiI6bnVsbH19&frame=false&hideBorder=false&hideFooter=false&hideHeader=false&hideScrollBar=false&lang=pt&maxHeight=600px&origin=http%3A%2F%2Flocalhost%3A32100%2F&sessionId=&theme=light&transparent=false&widgetsVersion=2615f7e52b7e0%3A1702314776716"
              className="w-full h-[600px] border-0"
              title="Tweets da NBA"
              loading="lazy"
            />
          </div>

          {/* Timeline 2: NBA Brasil */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                @NBABrasil
              </h3>
            </div>
            <iframe
              src="https://syndication.twitter.com/srv/timeline-profile/screen-name/NBABrasil?dnt=false&embedId=twitter-widget-1&features=eyJ0ZndfdGltZWxpbmVfbGlzdCI6eyJidWNrZXQiOltdLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X2ZvbGxvd2VyX2NvdW50X3N1bnNldCI6eyJidWNrZXQiOnRydWUsInZlcnNpb24iOm51bGx9LCJ0ZndfdHdlZXRfZWRpdF9iYWNrZW5kIjp7ImJ1Y2tldCI6Im9uIiwidmVyc2lvbiI6bnVsbH0sInRmd19yZWZzcmNfc2Vzc2lvbiI6eyJidWNrZXQiOiJvbiIsInZlcnNpb24iOm51bGx9LCJ0ZndfZm9zbnJfc29mdF9pbnRlcnZlbnRpb25zX2VuYWJsZWQiOnsiYnVja2V0Ijoib24iLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X21peGVkX21lZGlhXzE1ODk3Ijp7ImJ1Y2tldCI6InRyZWF0bWVudCIsInZlcnNpb24iOm51bGx9LCJ0ZndfZXhwZXJpbWVudHNfY29va2llX2V4cGlyYXRpb24iOnsiYnVja2V0IjoxMjA5NjAwLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X3Nob3dfYmlyZGhkYXkiOnsiYnVja2V0Ijoib24iLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X2R1cGxpY2F0ZV9zY3JpYmVzX3RvX3NldHRpbmdzIjp7ImJ1Y2tldCI6Im9uIiwidmVyc2lvbiI6bnVsbH0sInRmd191c2VfcHJvZmlsZV9pbWFnZV9zaGFwZV9lbmFibGVkIjp7ImJ1Y2tldCI6Im9uIiwidmVyc2lvbiI6bnVsbH0sInRmd192aWRlb19obHNfZHluYW1pY19tYW5pZmVzdHNfMTUwODIiOnsiYnVja2V0IjoidHJ1ZV9iaXRyYXRlIiwidmVyc2lvbiI6bnVsbH19&frame=false&hideBorder=false&hideFooter=false&hideHeader=false&hideScrollBar=false&lang=pt&maxHeight=600px&origin=http%3A%2F%2Flocalhost%3A32100%2F&sessionId=&theme=light&transparent=false&widgetsVersion=2615f7e52b7e0%3A1702314776716"
              className="w-full h-[600px] border-0"
              title="Tweets da NBA Brasil"
              loading="lazy"
            />
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Atualizações em tempo real direto do X (Twitter)
          </p>
        </div>
      </div>
    </section>
  );
}