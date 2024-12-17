import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ListingItem from "../components/ListingItem";

export default function Search() {
  const navigate = useNavigate();
  const [sidebardata, setSidebardata] = useState({
    searchTerm: "",
    type: "all",
    parking: false,
    furnished: false,
    offer: false,
    sort: "created_at",
    order: "desc",
  });

  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get("searchTerm");
    const addressFromUrl = urlParams.get("address");
    const typeFromUrl = urlParams.get("type");
    const parkingFromUrl = urlParams.get("parking");
    const furnishedFromUrl = urlParams.get("furnished");
    const offerFromUrl = urlParams.get("offer");
    const sortFromUrl = urlParams.get("sort");
    const orderFromUrl = urlParams.get("order");

    if (
      searchTermFromUrl ||
      addressFromUrl ||
      typeFromUrl ||
      parkingFromUrl ||
      furnishedFromUrl ||
      offerFromUrl ||
      sortFromUrl ||
      orderFromUrl
    ) {
      setSidebardata({
        searchTerm: searchTermFromUrl || "",
        address: addressFromUrl || "", 
        type: typeFromUrl || "all",
        parking: parkingFromUrl === "true" ? true : false,
        furnished: furnishedFromUrl === "true" ? true : false,
        offer: offerFromUrl === "true" ? true : false,
        sort: sortFromUrl || "created_at",
        order: orderFromUrl || "desc",
      });
    }

    const fetchListings = async () => {
      setLoading(true);
      setShowMore(false);
      const searchQuery = urlParams.toString();
      const res = await fetch(`/api/listing/get?${searchQuery}`);
      const data = await res.json();
      if (data.length > 8) {
        setShowMore(true);
      } else {
        setShowMore(false);
      }
      setListings(data);
      setLoading(false);
    };

    fetchListings();
  }, [location.search]);

  const handleChange = (e) => {
    if (
      e.target.id === "all" ||
      e.target.id === "sale" ||
      e.target.id === "buy"
    ) {
      setSidebardata({ ...sidebardata, type: e.target.id });
    }

    if (e.target.id === "searchTerm") {
      setSidebardata({ ...sidebardata, searchTerm: e.target.value });
    }

    if (
      e.target.id === "parking" ||
      e.target.id === "furnished" ||
      e.target.id === "offer"
    ) {
      setSidebardata({
        ...sidebardata,
        [e.target.id]:
          e.target.checked || e.target.checked === "true" ? true : false,
      });
    }

    if (e.target.id === "sort_order") {
      const sort = e.target.value.split("_")[0] || "created_at";

      const order = e.target.value.split("_")[1] || "desc";

      setSidebardata({ ...sidebardata, sort, order });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams();
  if (sidebardata.searchTerm) {
    urlParams.set("searchTerm", sidebardata.searchTerm);
  }
  if (sidebardata.address) {
    urlParams.set("address", sidebardata.address);
  }
    urlParams.set("searchTerm", sidebardata.searchTerm);
    urlParams.set("type", sidebardata.type);
    urlParams.set("parking", sidebardata.parking);
    urlParams.set("furnished", sidebardata.furnished);
    urlParams.set("offer", sidebardata.offer);
    urlParams.set("sort", sidebardata.sort);
    urlParams.set("order", sidebardata.order);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  const onShowMoreClick = async () => {
    const numberOfListings = listings.length;
    const startIndex = numberOfListings;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set("startIndex", startIndex);
    const searchQuery = urlParams.toString();
    const res = await fetch(`/api/listing/get?${searchQuery}`);
    const data = await res.json();
    if (data.length < 9) {
      setShowMore(false);
    }
    setListings([...listings, ...data]);
  };
  return (
    <div className="flex flex-col md:flex-row">
      <div className="p-7 border-b-2 md:border-r-2 md:min-h-screen">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap font-semibold">Tìm kiếm:</label>
            <input
              type="text"
              id="searchTerm"
              placeholder="Tìm kiếm ..."
              className="border rounded-lg p-3 w-full"
              value={sidebardata.searchTerm}
              onChange={handleChange}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap font-semibold">Vị trí:</label>
            <select
              id="address"
              className="border rounded-lg p-3 w-full"
              value={sidebardata.address || ""}
              onChange={(e) =>
                setSidebardata({ ...sidebardata, address: e.target.value })
              }
            >
              <option value="">Tất cả</option>
              <option value="HoChiMinh">Hồ Chí Minh</option>
              <option value="HaNoi">Hà Nội</option>
              <option value="DaNang">Đà Nẵng</option>
              <option value="BinhDuong">Bình Dương</option>
              <option value="DongNai">Đồng Nai</option>
              <option value="AnGiang">An Giang</option>
              <option value="BacLieu">Bạc Liêu</option>
              <option value="BacGiang">Bắc Giang</option>
              <option value="BaRiaVungTau">Bà Rịa Vũng Tàu</option>
              <option value="BacKan">Bắc Kạn</option>
              <option value="BacNinh">Bắc Ninh</option>
              <option value="BenTre">Bến Tre</option>
              <option value="BinhDinh">Bình Định</option>
              <option value="BinhPhuoc">Bình Phước</option>
              <option value="BinhThuan">Bình Thuận</option>
              <option value="CaMau">Cà Mau</option>
              <option value="CaoBang">Cao Bằng</option>
              <option value="CanTho">Cần Thơ</option>
              <option value="DakLak">Đắk Lắk</option>
              <option value="DakNong">Đắk Nông</option>
              <option value="DienBien">Điện Biện</option>
              <option value="DongThap">Đồng Tháp</option>
              <option value="GiaLai">Gia Lai</option>
              <option value="HaGiang">Hà Giang</option>
              <option value="HaNam">Hà Nam</option>
              <option value="HaTinh">Hà Tĩnh</option>
              <option value="HaiDuong">Hải Dương</option>
              <option value="HaiPhong">Hải Phòng</option>
              <option value="HauGiang">Hậu Giang</option>
              <option value="HoaBinh">Hòa Bình</option>
              <option value="HungYen">Hưng Yên</option>
              <option value="KhanhHoa">Khánh Hòa</option>
              <option value="KienGiang">Kiên Giang</option>
              <option value="KonTum">Kon Tum</option>
              <option value="LaiChau">Lai Châu</option>
              <option value="LamDong">Lâm Đồng</option>
              <option value="LangSon">Lạng Sơn</option>
              <option value="LaoCai">Lào Cai</option>
              <option value="LongAn">Long An</option>
              <option value="NamDinh">Nam Định</option>
              <option value="NgheAn">Nghệ An</option>
              <option value="NinhBinh">Ninh Bình</option>
              <option value="NinhThuan">Ninh Thuận</option>
              <option value="PhuTho">Phú Thọ</option>
              <option value="PhuYen">Phú Yên</option>
              <option value="QuangBinh">Quảng Bình</option>
              <option value="QuangNam">Quảng Nam</option>
              <option value="QuangNgai">Quảng Ngãi</option>
              <option value="QuangNinh">Quảng Ninh</option>
              <option value="QuangTri">Quảng Trị</option>
              <option value="SocTrang">Sóc Trăng</option>
              <option value="SonLa">Sơn La</option>
              <option value="TayNinh">Tây Ninh</option>
              <option value="ThaiBinh">Thái Bình</option>
              <option value="ThaiNguyen">Thái Nguyên</option>
              <option value="ThanhHoa">Thanh Hóa</option>
              <option value="ThuaThienHue">Thừa Thiên Huế</option>
              <option value="TienGiang">Tiền Giang</option>
              <option value="TraVinh">Trà Vinh</option>
              <option value="TuyenQuang">Tuyên Quang</option>
              <option value="VinhLong">Vĩnh Long</option>
              <option value="VinhPhuc">Vĩnh Phúc</option>
              <option value="YenBai">Yên Bái</option>
              <option value="LaiChau">Lai Châu</option>
            </select>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <label className="font-semibold">Loại:</label>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="all"
                className="w-5"
                onChange={handleChange}
                checked={sidebardata.type === "all"}
              />
              <span>Tất cả</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="sale"
                className="w-5"
                onChange={handleChange}
                checked={sidebardata.type === "sale"}
              />
              <span>Bán</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="buy"
                className="w-5"
                onChange={handleChange}
                checked={sidebardata.type === "buy"}
              />
              <span>Mua</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="offer"
                className="w-5"
                onChange={handleChange}
                checked={sidebardata.offer}
              />
              <span>Ưu đãi</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <label className="font-semibold">Tiện nghi:</label>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="parking"
                className="w-5"
                onChange={handleChange}
                checked={sidebardata.parking}
              />
              <span>Chỗ đậu xe</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="furnished"
                className="w-5"
                onChange={handleChange}
                checked={sidebardata.furnished}
              />
              <span>Trang bị nội thất</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-semibold">Sắp xếp:</label>
            <select
              onChange={handleChange}
              defaultValue={"created_at_desc"}
              id="sort_order"
              className="border rounded-lg p-3"
            >
              <option value="regularPrice_desc">Giá cao đến thấp</option>
              <option value="regularPrice_asc">Giá thấp đến cao</option>
              <option value="createdAt_desc">Mới nhất</option>
              <option value="createdAt_asc">Cũ nhất</option>
            </select>
          </div>
          <button className="bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95">
            Tìm kiếm
          </button>
        </form>
      </div>
      <div className="flex-1">
        <h1 className="text-3xl font-semibold border-b p-3 text-slate-700 mt-5">
          Kết quả tìm kiếm:
        </h1>
        <div className="p-7 flex flex-wrap gap-4">
          {!loading && listings.length === 0 && (
            <p className="text-xl text-slate-700">
              Không tìm thấy danh sách nào!
            </p>
          )}
          {loading && (
            <p className="text-xl text-slate-700 text-center w-full">
              Đang tải trang...
            </p>
          )}

          {!loading &&
            listings &&
            listings.map((listing) => (
              <ListingItem key={listing._id} listing={listing} />
            ))}

          {showMore && (
            <button
              onClick={onShowMoreClick}
              className="text-green-700 hover:underline p-7 text-center w-full"
            >
              Hiển thị thêm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
