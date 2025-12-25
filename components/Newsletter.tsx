export default function Newsletter() {
  return (
    <section className="bg-secondary py-16">
      <div className="container-base max-w-2xl text-center">
        <h3 className="text-xl font-bold mb-4">ニュースレター登録</h3>
        <p className="text-sm text-gray-500 mb-8">
          新商品やセール情報、クーポンをお届けします。
        </p>
        <form className="flex gap-2 max-w-md mx-auto">
          <input
            type="email"
            placeholder="メールアドレス"
            className="input-base"
            required
          />
          <button type="submit" className="btn-primary whitespace-nowrap">
            登録する
          </button>
        </form>
      </div>
    </section>
  );
}
