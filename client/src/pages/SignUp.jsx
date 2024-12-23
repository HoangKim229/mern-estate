import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OAuth from "../components/OAuth";

export default function SignUp() {
  const [formData, setFormData] = useState({
    role: "seller",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/auth/signup', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      console.log(data);
      if (data.success === false) {
        setLoading(false);
        setError(data.message);
        return;
      }
      setLoading(false);
      setError(null);
      navigate('/sign-in');
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl text-center font-semibold my-7">Đăng Ký</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Tên người dùng"
          className="border p-3 rounded-lg"
          id="username"
          onChange={handleChange}
        />
        <input
          type="email"
          placeholder="Email"
          className="border p-3 rounded-lg"
          id="email"
          onChange={handleChange}
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          className="border p-3 rounded-lg"
          id="password"
          onChange={handleChange}
        />

        <div className="flex flex-col gap-2">
          <label className="font-semibold">Vai trò:</label>
          <div className="flex gap-4 ">
            <button
              type="button"
              className={`p-3 border rounded-lg w-full ${formData.role === 'seller' ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 hover:bg-blue-200 hover:text-blue-700'}`}
              onClick={() => setFormData({ ...formData, role: 'seller' })}
            >
              Người Bán
            </button>
            <button
              type="button"
              className={`p-3 border rounded-lg w-full ${formData.role === 'buyer' ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 hover:bg-blue-200 hover:text-blue-700'}`}
              onClick={() => setFormData({ ...formData, role: 'buyer' })}
            >
              Người Mua
            </button>
          </div>
        </div>

        <button
          disabled={loading}
          className="bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
        >
          {loading ? "Đang tải trang..." : "Đăng Ký"}
        </button>
        <OAuth />
      </form>

      <div className="flex gap-2 mt-5">
        <p>Bạn đã có tài khoản?</p>
        <Link to={"/sign-in"}>
          <span className="text-blue-700">Đăng nhập</span>
        </Link>
      </div>
      {error && <p className='text-red-500 mt-5'>{error}</p>}
    </div>
  );
}
