import { useEffect, useState } from "react";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const params = useParams();
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: "",
    description: "",
    address: "",
    type: "sell",
    bedrooms: 1,
    bathrooms: 1,
    area: 0,
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });
  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false); // State để điều khiển mở modal
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [selectedStreet, setSelectedStreet] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedDisplayAddress, setSelectedDisplayAddress] = useState("");

  const [districtOptions, setDistrictOptions] = useState([]);

  const DEFAULT_IMAGE_URL =
    "https://png.pngtree.com/png-clipart/20200709/original/pngtree-real-estate-logo-png-image_3998579.jpg";

  useEffect(() => {
    const fetchListing = async () => {
      const listingId = params.listingId;
      const res = await fetch(`/api/listing/get/${listingId}`);
      const data = await res.json();
      if (data.success === false) {
        console.log(data.message);
        return;
      }
      setFormData(data);
    };

    fetchListing();
  }, []);

  const handleImageSubmit = (e) => {
    if (files.length > 0 && files.length + formData.imageUrls.length < 7) {
      setUploading(true);
      setImageUploadError(false);
      const promises = [];

      for (let i = 0; i < files.length; i++) {
        promises.push(storageImage(files[i]));
      }
      Promise.all(promises)
        .then((urls) => {
          setFormData({
            ...formData,
            imageUrls: formData.imageUrls.concat(urls),
          });
          setImageUploadError(false);
          setUploading(false);
        })
        .catch((err) => {
          setImageUploadError(
            "Tải hình ảnh lên không thành công (tối đa 2 mb cho mỗi hình ảnh)"
          );
          setUploading(false);
        });
    } else {
      setImageUploadError("Tổng số hình ảnh phải ít hơn 7");
      setUploading(false);
    }
  };

  const storageImage = async (file) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage(app);
      const fileName = new Date().getTime() + file.name;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });
  };

  const handleChange = (e) => {
    if (e.target.id === "sale" || e.target.id === "buy") {
      setFormData({
        ...formData,
        type: e.target.id,
      });
    }

    if (
      e.target.id === "parking" ||
      e.target.id === "furnished" ||
      e.target.id === "offer"
    ) {
      setFormData({
        ...formData,
        [e.target.id]: e.target.checked,
      });
    }

    if (
      e.target.type === "number" ||
      e.target.type === "text" ||
      e.target.type === "textarea"
    ) {
      setFormData({
        ...formData,
        [e.target.id]: e.target.value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (+formData.area <= 0) {
        return setError("Diện tích phải lớn hơn 0");
      }
      if (formData.imageUrls.length === 0)
        formData.imageUrls = [DEFAULT_IMAGE_URL];
      if (+formData.regularPrice < +formData.discountPrice)
        return setError("Giá giảm giá phải thấp hơn giá thông thường");
      setLoading(true);
      setError(false);
      const res = await fetch(`/api/listing/update/${params.listingId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userRef: currentUser._id,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success === false) {
        setError(data.message);
      }
      navigate(`/listing/${data._id}`);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleAddressSelection = () => {
    setIsAddressModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddressModalOpen(false);
  };

  const handleAddressChange = () => {
    setFormData({
      ...formData,
      address: `${selectedDisplayAddress}, ${selectedStreet}, ${selectedWard}, ${selectedDistrict}, ${selectedProvince}`,
    });
    handleCloseModal();
  };

  const districts = {
    HoChiMinh: [
      {
        value: "Bình Chánh",
        text: "Bình Chánh",
        wards: [
          {
            value: "Xã An Phú Tây",
            text: "Xã An Phú Tây",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 10B", text: "Đường 10B" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 11C", text: "Đường 11C" },
              { value: "Đường 11D", text: "Đường 11D" },
              { value: "Đường 11E", text: "Đường 11E" },
              { value: "Đường 12", text: "Đường 12" },
            ],
          },
          {
            value: "Xã Bình Chánh",
            text: "Xã Bình Chánh",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 10B", text: "Đường 10B" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 11C", text: "Đường 11C" },
              { value: "Đường 11D", text: "Đường 11D" },
              { value: "Đường 11E", text: "Đường 11E" },
              { value: "Đường 12", text: "Đường 12" },
            ],
          },
          {
            value: "Xã Bình Hưng",
            text: "Xã Bình Hưng",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 10B", text: "Đường 10B" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 11C", text: "Đường 11C" },
              { value: "Đường 11D", text: "Đường 11D" },
              { value: "Đường 11E", text: "Đường 11E" },
              { value: "Đường 12", text: "Đường 12" },
            ],
          },
          {
            value: "Xã Bình Lợi",
            text: "Xã Bình Lợi",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 10B", text: "Đường 10B" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 11C", text: "Đường 11C" },
              { value: "Đường 11D", text: "Đường 11D" },
              { value: "Đường 11E", text: "Đường 11E" },
              { value: "Đường 12", text: "Đường 12" },
            ],
          },
          {
            value: "Xã Đa Phước",
            text: "Xã Đa Phước",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 10B", text: "Đường 10B" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 11C", text: "Đường 11C" },
              { value: "Đường 11D", text: "Đường 11D" },
              { value: "Đường 11E", text: "Đường 11E" },
              { value: "Đường 12", text: "Đường 12" },
            ],
          },
          {
            value: "Xã Hưng Long",
            text: "Xã Hưng Long",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 10B", text: "Đường 10B" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 11C", text: "Đường 11C" },
              { value: "Đường 11D", text: "Đường 11D" },
              { value: "Đường 11E", text: "Đường 11E" },
              { value: "Đường 12", text: "Đường 12" },
            ],
          },
          {
            value: "Xã Lê Minh Xuân",
            text: "Xã Lê Minh Xuân",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 10B", text: "Đường 10B" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 11C", text: "Đường 11C" },
              { value: "Đường 11D", text: "Đường 11D" },
              { value: "Đường 11E", text: "Đường 11E" },
              { value: "Đường 12", text: "Đường 12" },
            ],
          },
          {
            value: "Xã Phạm Văn Hai",
            text: "Xã Phạm Văn Hai",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 10B", text: "Đường 10B" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 11C", text: "Đường 11C" },
              { value: "Đường 11D", text: "Đường 11D" },
              { value: "Đường 11E", text: "Đường 11E" },
              { value: "Đường 12", text: "Đường 12" },
            ],
          },
        ],
      },
      {
        value: "Bình Tân",
        text: "Bình Tân",
        wards: [
          {
            value: "Phường An Lạc",
            text: "Phường An Lạc",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 10B", text: "Đường 10B" },
              { value: "Đường 10C", text: "Đường 10C" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 111", text: "Đường 111" },
              { value: "Đường 11A", text: "Đường 11A" },
              { value: "Đường 12", text: "Đường 12" },
            ],
          },
          {
            value: "Phường An Lạc A",
            text: "Phường An Lạc A",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 10B", text: "Đường 10B" },
              { value: "Đường 10C", text: "Đường 10C" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 111", text: "Đường 111" },
              { value: "Đường 11A", text: "Đường 11A" },
              { value: "Đường 12", text: "Đường 12" },
            ],
          },
          {
            value: "Phường Bình Hưng Hoà",
            text: "Phường Bình Hưng Hoà",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 10B", text: "Đường 10B" },
              { value: "Đường 10C", text: "Đường 10C" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 111", text: "Đường 111" },
              { value: "Đường 11A", text: "Đường 11A" },
              { value: "Đường 12", text: "Đường 12" },
            ],
          },
          {
            value: "Phường Bình Hưng Hoà A",
            text: "Phường Bình Hưng Hoà A",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 10B", text: "Đường 10B" },
              { value: "Đường 10C", text: "Đường 10C" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 111", text: "Đường 111" },
              { value: "Đường 11A", text: "Đường 11A" },
              { value: "Đường 12", text: "Đường 12" },
            ],
          },
          {
            value: "Phường Bình Hưng Hoà B",
            text: "Phường Bình Hưng Hoà B",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 10B", text: "Đường 10B" },
              { value: "Đường 10C", text: "Đường 10C" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 111", text: "Đường 111" },
              { value: "Đường 11A", text: "Đường 11A" },
              { value: "Đường 12", text: "Đường 12" },
            ],
          },
          {
            value: "Phường Bình Trị Đông",
            text: "Phường Bình Trị Đông",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 10B", text: "Đường 10B" },
              { value: "Đường 10C", text: "Đường 10C" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 111", text: "Đường 111" },
              { value: "Đường 11A", text: "Đường 11A" },
              { value: "Đường 12", text: "Đường 12" },
            ],
          },
          {
            value: "Phường Bình Trị Đông A",
            text: "Phường Bình Trị Đông A",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 10B", text: "Đường 10B" },
              { value: "Đường 10C", text: "Đường 10C" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 111", text: "Đường 111" },
              { value: "Đường 11A", text: "Đường 11A" },
              { value: "Đường 12", text: "Đường 12" },
            ],
          },
          {
            value: "Phường Bình Trị Đông B",
            text: "Phường Bình Trị Đông B",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 10B", text: "Đường 10B" },
              { value: "Đường 10C", text: "Đường 10C" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 111", text: "Đường 111" },
              { value: "Đường 11A", text: "Đường 11A" },
              { value: "Đường 12", text: "Đường 12" },
            ],
          },
        ],
      },
      {
        value: "Bình Thạnh",
        text: "Bình Thạnh",
        wards: [
          {
            value: "Phường 1",
            text: "Phường 1",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 12AB", text: "Đường 12AB" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 135", text: "Đường 135" },
              { value: "Đường 14", text: "Đường 14" },
            ],
          },
          {
            value: "Phường 11",
            text: "Phường 11",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 12AB", text: "Đường 12AB" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 135", text: "Đường 135" },
              { value: "Đường 14", text: "Đường 14" },
            ],
          },
          {
            value: "Phường 12",
            text: "Phường 12",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 12AB", text: "Đường 12AB" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 135", text: "Đường 135" },
              { value: "Đường 14", text: "Đường 14" },
            ],
          },
          {
            value: "Phường 13",
            text: "Phường 13",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 12AB", text: "Đường 12AB" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 135", text: "Đường 135" },
              { value: "Đường 14", text: "Đường 14" },
            ],
          },
          {
            value: "Phường 14",
            text: "Phường 14",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 12AB", text: "Đường 12AB" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 135", text: "Đường 135" },
              { value: "Đường 14", text: "Đường 14" },
            ],
          },
          {
            value: "Phường 15",
            text: "Phường 15",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 12AB", text: "Đường 12AB" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 135", text: "Đường 135" },
              { value: "Đường 14", text: "Đường 14" },
            ],
          },
          {
            value: "Phường 17",
            text: "Phường 17",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 12AB", text: "Đường 12AB" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 135", text: "Đường 135" },
              { value: "Đường 14", text: "Đường 14" },
            ],
          },
          {
            value: "Phường 19",
            text: "Phường 19",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 12AB", text: "Đường 12AB" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 135", text: "Đường 135" },
              { value: "Đường 14", text: "Đường 14" },
            ],
          },
        ],
      },
      {
        value: "Cần Giờ",
        text: "Cần Giờ",
        wards: [
          {
            value: "Xã An Thới Đông",
            text: "Xã An Thới Đông",
            streets: [
              { value: "Đường 23/10", text: "Đường 23/10" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường 47", text: "Đường 47" },
              { value: "Đường An Bình", text: "Đường An Bình" },
              { value: "Đường An Hoà", text: "Đường An Hoà" },
              { value: "Đường An Phú Đông 27", text: "Đường An Phú Đông 27" },
              { value: "Đường An Thới Đông", text: "Đường An Thới Đông" },
              { value: "Đường Bà Xán", text: "Đường Bà Xán" },
            ],
          },
          {
            value: "Xã Bình Khánh",
            text: "Xã Bình Khánh",
            streets: [
              { value: "Đường 23/10", text: "Đường 23/10" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường 47", text: "Đường 47" },
              { value: "Đường An Bình", text: "Đường An Bình" },
              { value: "Đường An Hoà", text: "Đường An Hoà" },
              { value: "Đường An Phú Đông 27", text: "Đường An Phú Đông 27" },
              { value: "Đường An Thới Đông", text: "Đường An Thới Đông" },
              { value: "Đường Bà Xán", text: "Đường Bà Xán" },
            ],
          },
          {
            value: "Thị trấn Cần Thạnh",
            text: "Thị trấn Cần Thạnh",
            streets: [
              { value: "Đường 23/10", text: "Đường 23/10" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường 47", text: "Đường 47" },
              { value: "Đường An Bình", text: "Đường An Bình" },
              { value: "Đường An Hoà", text: "Đường An Hoà" },
              { value: "Đường An Phú Đông 27", text: "Đường An Phú Đông 27" },
              { value: "Đường An Thới Đông", text: "Đường An Thới Đông" },
              { value: "Đường Bà Xán", text: "Đường Bà Xán" },
            ],
          },
          {
            value: "Xã Long Hoà",
            text: "Xã Long Hoà",
            streets: [
              { value: "Đường 23/10", text: "Đường 23/10" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường 47", text: "Đường 47" },
              { value: "Đường An Bình", text: "Đường An Bình" },
              { value: "Đường An Hoà", text: "Đường An Hoà" },
              { value: "Đường An Phú Đông 27", text: "Đường An Phú Đông 27" },
              { value: "Đường An Thới Đông", text: "Đường An Thới Đông" },
              { value: "Đường Bà Xán", text: "Đường Bà Xán" },
            ],
          },
          {
            value: "Xã Lý Nhơn",
            text: "Xã Lý Nhơn",
            streets: [
              { value: "Đường 23/10", text: "Đường 23/10" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường 47", text: "Đường 47" },
              { value: "Đường An Bình", text: "Đường An Bình" },
              { value: "Đường An Hoà", text: "Đường An Hoà" },
              { value: "Đường An Phú Đông 27", text: "Đường An Phú Đông 27" },
              { value: "Đường An Thới Đông", text: "Đường An Thới Đông" },
              { value: "Đường Bà Xán", text: "Đường Bà Xán" },
            ],
          },
          {
            value: "Xã Tam Thôn Hiệp",
            text: "Xã Tam Thôn Hiệp",
            streets: [
              { value: "Đường 23/10", text: "Đường 23/10" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường 47", text: "Đường 47" },
              { value: "Đường An Bình", text: "Đường An Bình" },
              { value: "Đường An Hoà", text: "Đường An Hoà" },
              { value: "Đường An Phú Đông 27", text: "Đường An Phú Đông 27" },
              { value: "Đường An Thới Đông", text: "Đường An Thới Đông" },
              { value: "Đường Bà Xán", text: "Đường Bà Xán" },
            ],
          },
          {
            value: "Xã Thạnh An",
            text: "Xã Thạnh An",
            streets: [
              { value: "Đường 23/10", text: "Đường 23/10" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường 47", text: "Đường 47" },
              { value: "Đường An Bình", text: "Đường An Bình" },
              { value: "Đường An Hoà", text: "Đường An Hoà" },
              { value: "Đường An Phú Đông 27", text: "Đường An Phú Đông 27" },
              { value: "Đường An Thới Đông", text: "Đường An Thới Đông" },
              { value: "Đường Bà Xán", text: "Đường Bà Xán" },
            ],
          },
        ],
      },
      {
        value: "Củ Chi",
        text: "Củ Chi",
        wards: [
          {
            value: "Xã An Nhơn Tây",
            text: "Xã An Nhơn Tây",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 101", text: "Đường 101" },
              { value: "Đường 103", text: "Đường 103" },
              { value: "Đường 107", text: "Đường 107" },
              { value: "Đường 108", text: "Đường 108" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 110", text: "Đường 110" },
            ],
          },
          {
            value: "Xã An Phú",
            text: "Xã An Phú",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 101", text: "Đường 101" },
              { value: "Đường 103", text: "Đường 103" },
              { value: "Đường 107", text: "Đường 107" },
              { value: "Đường 108", text: "Đường 108" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 110", text: "Đường 110" },
            ],
          },
          {
            value: "Xã Bình Mỹ",
            text: "Xã Bình Mỹ",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 101", text: "Đường 101" },
              { value: "Đường 103", text: "Đường 103" },
              { value: "Đường 107", text: "Đường 107" },
              { value: "Đường 108", text: "Đường 108" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 110", text: "Đường 110" },
            ],
          },
          {
            value: "Thị trấn Củ Chi",
            text: "Thị trấn Củ Chi",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 101", text: "Đường 101" },
              { value: "Đường 103", text: "Đường 103" },
              { value: "Đường 107", text: "Đường 107" },
              { value: "Đường 108", text: "Đường 108" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 110", text: "Đường 110" },
            ],
          },
          {
            value: "Xã Hoà Phú",
            text: "Xã Hoà Phú",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 101", text: "Đường 101" },
              { value: "Đường 103", text: "Đường 103" },
              { value: "Đường 107", text: "Đường 107" },
              { value: "Đường 108", text: "Đường 108" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 110", text: "Đường 110" },
            ],
          },
          {
            value: "Xã Nhuận Đức",
            text: "Xã Nhuận Đức",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 101", text: "Đường 101" },
              { value: "Đường 103", text: "Đường 103" },
              { value: "Đường 107", text: "Đường 107" },
              { value: "Đường 108", text: "Đường 108" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 110", text: "Đường 110" },
            ],
          },
          {
            value: "Xã Phạm Văn Cội",
            text: "Xã Phạm Văn Cội",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 101", text: "Đường 101" },
              { value: "Đường 103", text: "Đường 103" },
              { value: "Đường 107", text: "Đường 107" },
              { value: "Đường 108", text: "Đường 108" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 110", text: "Đường 110" },
            ],
          },
          {
            value: "Xã Phú Hoà Đông",
            text: "Xã Phú Hoà Đông",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 101", text: "Đường 101" },
              { value: "Đường 103", text: "Đường 103" },
              { value: "Đường 107", text: "Đường 107" },
              { value: "Đường 108", text: "Đường 108" },
              { value: "Đường 10A", text: "Đường 10A" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 110", text: "Đường 110" },
            ],
          },
        ],
      },
      {
        value: "Gò Vấp",
        text: "Gò Vấp",
        wards: [
          {
            value: "Phường 1",
            text: "Phường 1",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 111", text: "Đường 111" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 13", text: "Đường 14" },
              { value: "Đường 14", text: "Đường 14" },
            ],
          },
          {
            value: "Phường 10",
            text: "Phường 10",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 111", text: "Đường 111" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 13", text: "Đường 14" },
              { value: "Đường 14", text: "Đường 14" },
            ],
          },
          {
            value: "Phường 11",
            text: "Phường 11",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 111", text: "Đường 111" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 13", text: "Đường 14" },
              { value: "Đường 14", text: "Đường 14" },
            ],
          },
          {
            value: "Phường 12",
            text: "Phường 12",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 111", text: "Đường 111" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 13", text: "Đường 14" },
              { value: "Đường 14", text: "Đường 14" },
            ],
          },
          {
            value: "Phường 13",
            text: "Phường 13",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 111", text: "Đường 111" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 13", text: "Đường 14" },
              { value: "Đường 14", text: "Đường 14" },
            ],
          },
          {
            value: "Phường 14",
            text: "Phường 14",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 111", text: "Đường 111" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 13", text: "Đường 14" },
              { value: "Đường 14", text: "Đường 14" },
            ],
          },
          {
            value: "Phường 15",
            text: "Phường 15",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 111", text: "Đường 111" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 13", text: "Đường 14" },
              { value: "Đường 14", text: "Đường 14" },
            ],
          },
          {
            value: "Phường 16",
            text: "Phường 16",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 11", text: "Đường 11" },
              { value: "Đường 111", text: "Đường 111" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 13", text: "Đường 14" },
              { value: "Đường 14", text: "Đường 14" },
            ],
          },
        ],
      },
      {
        value: "Quận 1",
        text: "Quận 1",
        wards: [
          {
            value: "Phường Bến Nghé",
            text: "Phường Bến Nghé",
            streets: [
              { value: "Đường 15B", text: "Đường 15B" },
              { value: "Đường 3A", text: "Đường 3A" },
              { value: "Đường Alexandre", text: "Đường Alexandre" },
              {
                value: "Phố Bà Huyện Thanh Quan",
                text: "Phố Bà Huyện Thanh Quan",
              },
              { value: "Đường Bà Lê Chân", text: "Đường Bà Lê Chân" },
              {
                value: "Đường Bến Chương Dương",
                text: "Đường Bến Chương Dương",
              },
              { value: "Đường Bùi Thị Xuân", text: "Đường Bùi Thị Xuân" },
              { value: "Đường Bùi Viện", text: "Đường Bùi Viện" },
            ],
          },
          {
            value: "Phường Bến Thành",
            text: "Phường Bến Thành",
            streets: [
              { value: "Đường 15B", text: "Đường 15B" },
              { value: "Đường 3A", text: "Đường 3A" },
              { value: "Đường Alexandre", text: "Đường Alexandre" },
              {
                value: "Phố Bà Huyện Thanh Quan",
                text: "Phố Bà Huyện Thanh Quan",
              },
              { value: "Đường Bà Lê Chân", text: "Đường Bà Lê Chân" },
              {
                value: "Đường Bến Chương Dương",
                text: "Đường Bến Chương Dương",
              },
              { value: "Đường Bùi Thị Xuân", text: "Đường Bùi Thị Xuân" },
              { value: "Đường Bùi Viện", text: "Đường Bùi Viện" },
            ],
          },
          {
            value: "Phường Cầu Kho",
            text: "Phường Cầu Kho",
            streets: [
              { value: "Đường 15B", text: "Đường 15B" },
              { value: "Đường 3A", text: "Đường 3A" },
              { value: "Đường Alexandre", text: "Đường Alexandre" },
              {
                value: "Phố Bà Huyện Thanh Quan",
                text: "Phố Bà Huyện Thanh Quan",
              },
              { value: "Đường Bà Lê Chân", text: "Đường Bà Lê Chân" },
              {
                value: "Đường Bến Chương Dương",
                text: "Đường Bến Chương Dương",
              },
              { value: "Đường Bùi Thị Xuân", text: "Đường Bùi Thị Xuân" },
              { value: "Đường Bùi Viện", text: "Đường Bùi Viện" },
            ],
          },
          {
            value: "Phường Cầu Ông Lãnh",
            text: "Phường Cầu Ông Lãnh",
            streets: [
              { value: "Đường 15B", text: "Đường 15B" },
              { value: "Đường 3A", text: "Đường 3A" },
              { value: "Đường Alexandre", text: "Đường Alexandre" },
              {
                value: "Phố Bà Huyện Thanh Quan",
                text: "Phố Bà Huyện Thanh Quan",
              },
              { value: "Đường Bà Lê Chân", text: "Đường Bà Lê Chân" },
              {
                value: "Đường Bến Chương Dương",
                text: "Đường Bến Chương Dương",
              },
              { value: "Đường Bùi Thị Xuân", text: "Đường Bùi Thị Xuân" },
              { value: "Đường Bùi Viện", text: "Đường Bùi Viện" },
            ],
          },
          {
            value: "Phường Cô Giang",
            text: "Phường Cô Giang",
            streets: [
              { value: "Đường 15B", text: "Đường 15B" },
              { value: "Đường 3A", text: "Đường 3A" },
              { value: "Đường Alexandre", text: "Đường Alexandre" },
              {
                value: "Phố Bà Huyện Thanh Quan",
                text: "Phố Bà Huyện Thanh Quan",
              },
              { value: "Đường Bà Lê Chân", text: "Đường Bà Lê Chân" },
              {
                value: "Đường Bến Chương Dương",
                text: "Đường Bến Chương Dương",
              },
              { value: "Đường Bùi Thị Xuân", text: "Đường Bùi Thị Xuân" },
              { value: "Đường Bùi Viện", text: "Đường Bùi Viện" },
            ],
          },
          {
            value: "Phường Đa Kao",
            text: "Phường Đa Kao",
            streets: [
              { value: "Đường 15B", text: "Đường 15B" },
              { value: "Đường 3A", text: "Đường 3A" },
              { value: "Đường Alexandre", text: "Đường Alexandre" },
              {
                value: "Phố Bà Huyện Thanh Quan",
                text: "Phố Bà Huyện Thanh Quan",
              },
              { value: "Đường Bà Lê Chân", text: "Đường Bà Lê Chân" },
              {
                value: "Đường Bến Chương Dương",
                text: "Đường Bến Chương Dương",
              },
              { value: "Đường Bùi Thị Xuân", text: "Đường Bùi Thị Xuân" },
              { value: "Đường Bùi Viện", text: "Đường Bùi Viện" },
            ],
          },
          {
            value: "Phường Nguyễn Cư Trinh",
            text: "Phường Nguyễn Cư Trinh",
            streets: [
              { value: "Đường 15B", text: "Đường 15B" },
              { value: "Đường 3A", text: "Đường 3A" },
              { value: "Đường Alexandre", text: "Đường Alexandre" },
              {
                value: "Phố Bà Huyện Thanh Quan",
                text: "Phố Bà Huyện Thanh Quan",
              },
              { value: "Đường Bà Lê Chân", text: "Đường Bà Lê Chân" },
              {
                value: "Đường Bến Chương Dương",
                text: "Đường Bến Chương Dương",
              },
              { value: "Đường Bùi Thị Xuân", text: "Đường Bùi Thị Xuân" },
              { value: "Đường Bùi Viện", text: "Đường Bùi Viện" },
            ],
          },
          {
            value: "Phường Nguyễn Thái Bình",
            text: "Phường Nguyễn Thái Bình",
            streets: [
              { value: "Đường 15B", text: "Đường 15B" },
              { value: "Đường 3A", text: "Đường 3A" },
              { value: "Đường Alexandre", text: "Đường Alexandre" },
              {
                value: "Phố Bà Huyện Thanh Quan",
                text: "Phố Bà Huyện Thanh Quan",
              },
              { value: "Đường Bà Lê Chân", text: "Đường Bà Lê Chân" },
              {
                value: "Đường Bến Chương Dương",
                text: "Đường Bến Chương Dương",
              },
              { value: "Đường Bùi Thị Xuân", text: "Đường Bùi Thị Xuân" },
              { value: "Đường Bùi Viện", text: "Đường Bùi Viện" },
            ],
          },
        ],
      },
      {
        value: "Quận 12",
        text: "Quận 12",
        wards: [
          {
            value: "Phường An Phú Đông",
            text: "Phường An Phú Đông",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 122", text: "Đường 122" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 14", text: "Đường 14" },
              { value: "Đường 15", text: "Đường 15" },
              { value: "Đường 16", text: "Đường 16" },
            ],
          },
          {
            value: "Phường Đông Hưng Thuận",
            text: "Phường Đông Hưng Thuận",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 122", text: "Đường 122" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 14", text: "Đường 14" },
              { value: "Đường 15", text: "Đường 15" },
              { value: "Đường 16", text: "Đường 16" },
            ],
          },
          {
            value: "Phường Hiệp Thành",
            text: "Phường Hiệp Thành",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 122", text: "Đường 122" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 14", text: "Đường 14" },
              { value: "Đường 15", text: "Đường 15" },
              { value: "Đường 16", text: "Đường 16" },
            ],
          },
          {
            value: "Phường Tân Chánh Hiệp",
            text: "Phường Tân Chánh Hiệp",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 122", text: "Đường 122" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 14", text: "Đường 14" },
              { value: "Đường 15", text: "Đường 15" },
              { value: "Đường 16", text: "Đường 16" },
            ],
          },
          {
            value: "Phường Tân Hưng Thuận",
            text: "Phường Tân Hưng Thuận",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 122", text: "Đường 122" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 14", text: "Đường 14" },
              { value: "Đường 15", text: "Đường 15" },
              { value: "Đường 16", text: "Đường 16" },
            ],
          },
          {
            value: "Phường Tân Thới Hiệp",
            text: "Phường Tân Thới Hiệp",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 122", text: "Đường 122" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 14", text: "Đường 14" },
              { value: "Đường 15", text: "Đường 15" },
              { value: "Đường 16", text: "Đường 16" },
            ],
          },
          {
            value: "Phường Tân Thới Nhất",
            text: "Phường Tân Thới Nhất",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 122", text: "Đường 122" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 14", text: "Đường 14" },
              { value: "Đường 15", text: "Đường 15" },
              { value: "Đường 16", text: "Đường 16" },
            ],
          },
          {
            value: "Phường Thanh Lộc",
            text: "Phường Thanh Lộc",
            streets: [
              { value: "Đường 1", text: "Đường 1" },
              { value: "Đường 10", text: "Đường 10" },
              { value: "Đường 12", text: "Đường 12" },
              { value: "Đường 122", text: "Đường 122" },
              { value: "Đường 13", text: "Đường 13" },
              { value: "Đường 14", text: "Đường 14" },
              { value: "Đường 15", text: "Đường 15" },
              { value: "Đường 16", text: "Đường 16" },
            ],
          },
        ],
      },
    ],
    HaNoi: [
      {
        value: "Ba Đình",
        text: "Ba Đình",
        wards: [
          {
            value: "Phường Cống Vị",
            text: "Phường Cống Vị",
            streets: [
              { value: "Đường 10", text: "Đường 10" },
              { value: "Phố An Xá", text: "Phố An Xá" },
              {
                value: "Phố Bà Huyện Thanh Quan",
                text: "Phố Bà Huyện Thanh Quan",
              },
              { value: "Đường Bắc Sơn", text: "Đường Bắc Sơn" },
              { value: "Đường Bưởi", text: "Đường Bưởi" },
              { value: "Đường Cao Bá Quát", text: "Đường Cao Bá Quát" },
              { value: "Đường Cầu Giấy", text: "Đường Cầu Giấy" },
              { value: "Phố Châu Long", text: "Phố Châu Long" },
            ],
          },
          {
            value: "Phường Điện Biên",
            text: "Phường Điện Biên",
            streets: [
              { value: "Đường 10", text: "Đường 10" },
              { value: "Phố An Xá", text: "Phố An Xá" },
              {
                value: "Phố Bà Huyện Thanh Quan",
                text: "Phố Bà Huyện Thanh Quan",
              },
              { value: "Đường Bắc Sơn", text: "Đường Bắc Sơn" },
              { value: "Đường Bưởi", text: "Đường Bưởi" },
              { value: "Đường Cao Bá Quát", text: "Đường Cao Bá Quát" },
              { value: "Đường Cầu Giấy", text: "Đường Cầu Giấy" },
              { value: "Phố Châu Long", text: "Phố Châu Long" },
            ],
          },
          {
            value: "Phường Đội Cấn",
            text: "Phường Đội Cấn",
            streets: [
              { value: "Đường 10", text: "Đường 10" },
              { value: "Phố An Xá", text: "Phố An Xá" },
              {
                value: "Phố Bà Huyện Thanh Quan",
                text: "Phố Bà Huyện Thanh Quan",
              },
              { value: "Đường Bắc Sơn", text: "Đường Bắc Sơn" },
              { value: "Đường Bưởi", text: "Đường Bưởi" },
              { value: "Đường Cao Bá Quát", text: "Đường Cao Bá Quát" },
              { value: "Đường Cầu Giấy", text: "Đường Cầu Giấy" },
              { value: "Phố Châu Long", text: "Phố Châu Long" },
            ],
          },
          {
            value: "Phường Giảng Võ",
            text: "Phường Giảng Võ",
            streets: [
              { value: "Đường 10", text: "Đường 10" },
              { value: "Phố An Xá", text: "Phố An Xá" },
              {
                value: "Phố Bà Huyện Thanh Quan",
                text: "Phố Bà Huyện Thanh Quan",
              },
              { value: "Đường Bắc Sơn", text: "Đường Bắc Sơn" },
              { value: "Đường Bưởi", text: "Đường Bưởi" },
              { value: "Đường Cao Bá Quát", text: "Đường Cao Bá Quát" },
              { value: "Đường Cầu Giấy", text: "Đường Cầu Giấy" },
              { value: "Phố Châu Long", text: "Phố Châu Long" },
            ],
          },
          {
            value: "Phường Kim Mã",
            text: "Phường Kim Mã",
            streets: [
              { value: "Đường 10", text: "Đường 10" },
              { value: "Phố An Xá", text: "Phố An Xá" },
              {
                value: "Phố Bà Huyện Thanh Quan",
                text: "Phố Bà Huyện Thanh Quan",
              },
              { value: "Đường Bắc Sơn", text: "Đường Bắc Sơn" },
              { value: "Đường Bưởi", text: "Đường Bưởi" },
              { value: "Đường Cao Bá Quát", text: "Đường Cao Bá Quát" },
              { value: "Đường Cầu Giấy", text: "Đường Cầu Giấy" },
              { value: "Phố Châu Long", text: "Phố Châu Long" },
            ],
          },
          {
            value: "Phường Liễu Giai",
            text: "Phường Liễu Giai",
            streets: [
              { value: "Đường 10", text: "Đường 10" },
              { value: "Phố An Xá", text: "Phố An Xá" },
              {
                value: "Phố Bà Huyện Thanh Quan",
                text: "Phố Bà Huyện Thanh Quan",
              },
              { value: "Đường Bắc Sơn", text: "Đường Bắc Sơn" },
              { value: "Đường Bưởi", text: "Đường Bưởi" },
              { value: "Đường Cao Bá Quát", text: "Đường Cao Bá Quát" },
              { value: "Đường Cầu Giấy", text: "Đường Cầu Giấy" },
              { value: "Phố Châu Long", text: "Phố Châu Long" },
            ],
          },
          {
            value: "Phường Ngọc Hà",
            text: "Phường Ngọc Hà",
            streets: [
              { value: "Đường 10", text: "Đường 10" },
              { value: "Phố An Xá", text: "Phố An Xá" },
              {
                value: "Phố Bà Huyện Thanh Quan",
                text: "Phố Bà Huyện Thanh Quan",
              },
              { value: "Đường Bắc Sơn", text: "Đường Bắc Sơn" },
              { value: "Đường Bưởi", text: "Đường Bưởi" },
              { value: "Đường Cao Bá Quát", text: "Đường Cao Bá Quát" },
              { value: "Đường Cầu Giấy", text: "Đường Cầu Giấy" },
              { value: "Phố Châu Long", text: "Phố Châu Long" },
            ],
          },
          {
            value: "Phường Ngọc Khánh",
            text: "Phường Ngọc Khánh",
            streets: [
              { value: "Đường 10", text: "Đường 10" },
              { value: "Phố An Xá", text: "Phố An Xá" },
              {
                value: "Phố Bà Huyện Thanh Quan",
                text: "Phố Bà Huyện Thanh Quan",
              },
              { value: "Đường Bắc Sơn", text: "Đường Bắc Sơn" },
              { value: "Đường Bưởi", text: "Đường Bưởi" },
              { value: "Đường Cao Bá Quát", text: "Đường Cao Bá Quát" },
              { value: "Đường Cầu Giấy", text: "Đường Cầu Giấy" },
              { value: "Phố Châu Long", text: "Phố Châu Long" },
            ],
          },
        ],
      },
      {
        value: "Ba Vì",
        text: "Ba Vì",
        wards: [
          {
            value: "Xã Ba Trại",
            text: "Xã Ba Trại",
            streets: [
              { value: "Đường 415", text: "Đường 415" },
              { value: "Đường 446", text: "Đường 446" },
              { value: "Đường 87A", text: "Đường 87A" },
              { value: "Đường Chu Minh", text: "Đường Chu Minh" },
              {
                value: "Đường Đại Lộ Thăng Long",
                text: "Đường Đại Lộ Thăng Long",
              },
              { value: "Đường ĐT 414", text: "Đường ĐT 414" },
              { value: "Đường ĐT 422", text: "Đường ĐT 422" },
              { value: "Đường ĐT 86", text: "Đường ĐT 86" },
            ],
          },
          {
            value: "Xã Ba Vì",
            text: "Xã Ba Vì",
            streets: [
              { value: "Đường 415", text: "Đường 415" },
              { value: "Đường 446", text: "Đường 446" },
              { value: "Đường 87A", text: "Đường 87A" },
              { value: "Đường Chu Minh", text: "Đường Chu Minh" },
              {
                value: "Đường Đại Lộ Thăng Long",
                text: "Đường Đại Lộ Thăng Long",
              },
              { value: "Đường ĐT 414", text: "Đường ĐT 414" },
              { value: "Đường ĐT 422", text: "Đường ĐT 422" },
              { value: "Đường ĐT 86", text: "Đường ĐT 86" },
            ],
          },
          {
            value: "Xã Cẩm Lĩnh",
            text: "Xã Cẩm Lĩnh",
            streets: [
              { value: "Đường 415", text: "Đường 415" },
              { value: "Đường 446", text: "Đường 446" },
              { value: "Đường 87A", text: "Đường 87A" },
              { value: "Đường Chu Minh", text: "Đường Chu Minh" },
              {
                value: "Đường Đại Lộ Thăng Long",
                text: "Đường Đại Lộ Thăng Long",
              },
              { value: "Đường ĐT 414", text: "Đường ĐT 414" },
              { value: "Đường ĐT 422", text: "Đường ĐT 422" },
              { value: "Đường ĐT 86", text: "Đường ĐT 86" },
            ],
          },
          {
            value: "Xã Cam Thượng",
            text: "Xã Cam Thượng",
            streets: [
              { value: "Đường 415", text: "Đường 415" },
              { value: "Đường 446", text: "Đường 446" },
              { value: "Đường 87A", text: "Đường 87A" },
              { value: "Đường Chu Minh", text: "Đường Chu Minh" },
              {
                value: "Đường Đại Lộ Thăng Long",
                text: "Đường Đại Lộ Thăng Long",
              },
              { value: "Đường ĐT 414", text: "Đường ĐT 414" },
              { value: "Đường ĐT 422", text: "Đường ĐT 422" },
              { value: "Đường ĐT 86", text: "Đường ĐT 86" },
            ],
          },
          {
            value: "Xã Châu Sơn",
            text: "Xã Châu Sơn",
            streets: [
              { value: "Đường 415", text: "Đường 415" },
              { value: "Đường 446", text: "Đường 446" },
              { value: "Đường 87A", text: "Đường 87A" },
              { value: "Đường Chu Minh", text: "Đường Chu Minh" },
              {
                value: "Đường Đại Lộ Thăng Long",
                text: "Đường Đại Lộ Thăng Long",
              },
              { value: "Đường ĐT 414", text: "Đường ĐT 414" },
              { value: "Đường ĐT 422", text: "Đường ĐT 422" },
              { value: "Đường ĐT 86", text: "Đường ĐT 86" },
            ],
          },
          {
            value: "Xã Chu Minh",
            text: "Xã Chu Minh",
            streets: [
              { value: "Đường 415", text: "Đường 415" },
              { value: "Đường 446", text: "Đường 446" },
              { value: "Đường 87A", text: "Đường 87A" },
              { value: "Đường Chu Minh", text: "Đường Chu Minh" },
              {
                value: "Đường Đại Lộ Thăng Long",
                text: "Đường Đại Lộ Thăng Long",
              },
              { value: "Đường ĐT 414", text: "Đường ĐT 414" },
              { value: "Đường ĐT 422", text: "Đường ĐT 422" },
              { value: "Đường ĐT 86", text: "Đường ĐT 86" },
            ],
          },
          {
            value: "Xã Cổ Đô",
            text: "Xã Cổ Đô",
            streets: [
              { value: "Đường 415", text: "Đường 415" },
              { value: "Đường 446", text: "Đường 446" },
              { value: "Đường 87A", text: "Đường 87A" },
              { value: "Đường Chu Minh", text: "Đường Chu Minh" },
              {
                value: "Đường Đại Lộ Thăng Long",
                text: "Đường Đại Lộ Thăng Long",
              },
              { value: "Đường ĐT 414", text: "Đường ĐT 414" },
              { value: "Đường ĐT 422", text: "Đường ĐT 422" },
              { value: "Đường ĐT 86", text: "Đường ĐT 86" },
            ],
          },
          {
            value: "Xã Đông Quang",
            text: "Xã Đông Quang",
            streets: [
              { value: "Đường 415", text: "Đường 415" },
              { value: "Đường 446", text: "Đường 446" },
              { value: "Đường 87A", text: "Đường 87A" },
              { value: "Đường Chu Minh", text: "Đường Chu Minh" },
              {
                value: "Đường Đại Lộ Thăng Long",
                text: "Đường Đại Lộ Thăng Long",
              },
              { value: "Đường ĐT 414", text: "Đường ĐT 414" },
              { value: "Đường ĐT 422", text: "Đường ĐT 422" },
              { value: "Đường ĐT 86", text: "Đường ĐT 86" },
            ],
          },
        ],
      },
      {
        value: "Hoàn Kiếm",
        text: "Hoàn Kiếm",
        wards: [
          {
            value: "Phường Hàng Bạc",
            text: "Phường Hàng Bạc",
            streets: [
              { value: "Đường Hàng Bạc", text: "Đường Hàng Bạc" },
              { value: "Đường Đào Duy Từ", text: "Đường Đào Duy Từ" },
              {
                value: "Đường Lương Ngọc Quyến",
                text: "Đường Lương Ngọc Quyến",
              },
              { value: "Đường Tạ Hiện", text: "Đường Tạ Hiện" },
              { value: "Đường Hàng Ngang", text: "Đường Hàng Ngang" },
              { value: "Đường Hàng Buồm", text: "Đường Hàng Buồm" },
              { value: "Đường Hàng Đào", text: "Đường Hàng Đào" },
              { value: "Đường Hàng Gai", text: "Đường Hàng Gai" },
            ],
          },
          {
            value: "Phường Chương Dương",
            text: "Phường Chương Dương",
            streets: [
              { value: "Đường Trần Nhật Duật", text: "Đường Trần Nhật Duật" },
              { value: "Đường Nguyễn Hữu Huân", text: "Đường Nguyễn Hữu Huân" },
              { value: "Đường Hàng Tre", text: "Đường Hàng Tre" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Hàng Vôi", text: "Đường Hàng Vôi" },
              { value: "Đường Hàng Bài", text: "Đường Hàng Bài" },
              { value: "Đường Hàng Bông", text: "Đường Hàng Bông" },
              { value: "Đường Hàng Cót", text: "Đường Hàng Cót" },
            ],
          },
          {
            value: "Phường Hàng Đào",
            text: "Phường Hàng Đào",
            streets: [
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Trần Nguyên Hãn", text: "Đường Trần Nguyên Hãn" },
              { value: "Đường Hàng Khay", text: "Đường Hàng Khay" },
              { value: "Đường Hàng Bông", text: "Đường Hàng Bông" },
              { value: "Đường Hàng Cân", text: "Đường Hàng Cân" },
              { value: "Đường Hàng Hành", text: "Đường Hàng Hành" },
              { value: "Đường Hàng Gai", text: "Đường Hàng Gai" },
              { value: "Đường Lê Thái Tổ", text: "Đường Lê Thái Tổ" },
            ],
          },
          {
            value: "Phường Hàng Mã",
            text: "Phường Hàng Mã",
            streets: [
              { value: "Đường Hàng Mã", text: "Đường Hàng Mã" },
              { value: "Đường Hàng Chiếu", text: "Đường Hàng Chiếu" },
              { value: "Đường Hàng Gà", text: "Đường Hàng Gà" },
              { value: "Đường Hàng Đậu", text: "Đường Hàng Đậu" },
              { value: "Đường Hàng Tre", text: "Đường Hàng Tre" },
              { value: "Đường Hàng Vải", text: "Đường Hàng Vải" },
              { value: "Đường Hàng Đồng", text: "Đường Hàng Đồng" },
              { value: "Đường Hàng Cân", text: "Đường Hàng Cân" },
            ],
          },
          {
            value: "Phường Hàng Trống",
            text: "Phường Hàng Trống",
            streets: [
              { value: "Đường Hàng Trống", text: "Đường Hàng Trống" },
              { value: "Đường Hàng Thiếc", text: "Đường Hàng Thiếc" },
              { value: "Đường Hàng Chai", text: "Đường Hàng Chai" },
              { value: "Đường Hàng Giấy", text: "Đường Hàng Giấy" },
              { value: "Đường Hàng Đồng", text: "Đường Hàng Đồng" },
              { value: "Đường Hàng Tre", text: "Đường Hàng Tre" },
              { value: "Đường Hàng Hành", text: "Đường Hàng Hành" },
              { value: "Đường Hàng Quạt", text: "Đường Hàng Quạt" },
            ],
          },
          {
            value: "Phường Cửa Nam",
            text: "Phường Cửa Nam",
            streets: [
              { value: "Đường Nguyễn Thái Học", text: "Đường Nguyễn Thái Học" },
              { value: "Đường Quốc Tử Giám", text: "Đường Quốc Tử Giám" },
              { value: "Đường Cát Linh", text: "Đường Cát Linh" },
              { value: "Đường Tôn Đức Thắng", text: "Đường Tôn Đức Thắng" },
              { value: "Đường Lê Duẩn", text: "Đường Lê Duẩn" },
              { value: "Đường Khâm Thiên", text: "Đường Khâm Thiên" },
              { value: "Đường Hoàng Diệu", text: "Đường Hoàng Diệu" },
              { value: "Đường Điện Biên Phủ", text: "Đường Điện Biên Phủ" },
            ],
          },
          {
            value: "Phường Hàng Buồm",
            text: "Phường Hàng Buồm",
            streets: [
              { value: "Đường Hàng Buồm", text: "Đường Hàng Buồm" },
              { value: "Đường Hàng Đường", text: "Đường Hàng Đường" },
              { value: "Đường Hàng Mắm", text: "Đường Hàng Mắm" },
              { value: "Đường Hàng Muối", text: "Đường Hàng Muối" },
              { value: "Đường Hàng Nón", text: "Đường Hàng Nón" },
              { value: "Đường Hàng Trống", text: "Đường Hàng Trống" },
              { value: "Đường Hàng Cân", text: "Đường Hàng Cân" },
              { value: "Đường Hàng Gai", text: "Đường Hàng Gai" },
            ],
          },
          {
            value: "Phường Hàng Đào",
            text: "Phường Hàng Đào",
            streets: [
              { value: "Đường Hàng Đào", text: "Đường Hàng Đào" },
              { value: "Đường Hàng Thiếc", text: "Đường Hàng Thiếc" },
              { value: "Đường Hàng Gai", text: "Đường Hàng Gai" },
              { value: "Đường Hàng Nón", text: "Đường Hàng Nón" },
              { value: "Đường Hàng Quạt", text: "Đường Hàng Quạt" },
              { value: "Đường Hàng Tre", text: "Đường Hàng Tre" },
              { value: "Đường Hàng Vải", text: "Đường Hàng Vải" },
              { value: "Đường Hàng Đồng", text: "Đường Hàng Đồng" },
            ],
          },
        ],
      },
      {
        value: "Bắc Từ Liêm",
        text: "Bắc Từ Liêm",
        wards: [
          {
            value: "Phường Đông Ngạc",
            text: "Phường Đông Ngạc",
            streets: [
              { value: "Đường Đông Ngạc", text: "Đường Đông Ngạc" },
              { value: "Đường Tân Xuân", text: "Đường Tân Xuân" },
              { value: "Đường Đức Diễn", text: "Đường Đức Diễn" },
              { value: "Đường Cổ Nhuế", text: "Đường Cổ Nhuế" },
              {
                value: "Đường Đường Phạm Văn Đồng",
                text: "Đường Phạm Văn Đồng",
              },
              { value: "Đường Hoàng Quốc Việt", text: "Đường Hoàng Quốc Việt" },
              { value: "Đường Trần Cung", text: "Đường Trần Cung" },
              { value: "Đường Lê Văn Hiến", text: "Đường Lê Văn Hiến" },
            ],
          },
          {
            value: "Phường Đức Thắng",
            text: "Phường Đức Thắng",
            streets: [
              { value: "Đường Đức Thắng", text: "Đường Đức Thắng" },
              { value: "Đường Hoàng Tăng Bí", text: "Đường Hoàng Tăng Bí" },
              { value: "Đường Cổ Nhuế", text: "Đường Cổ Nhuế" },
              { value: "Đường Xuân Đỉnh", text: "Đường Xuân Đỉnh" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Trần Cung", text: "Đường Trần Cung" },
              { value: "Đường Tân Xuân", text: "Đường Tân Xuân" },
              { value: "Đường Lê Văn Hiến", text: "Đường Lê Văn Hiến" },
            ],
          },
          {
            value: "Phường Liên Mạc",
            text: "Phường Liên Mạc",
            streets: [
              { value: "Đường Liên Mạc", text: "Đường Liên Mạc" },
              { value: "Đường Cầu Noi", text: "Đường Cầu Noi" },
              { value: "Đường Phúc Diễn", text: "Đường Phúc Diễn" },
              { value: "Đường Tân Phong", text: "Đường Tân Phong" },
              { value: "Đường Văn Tiến Dũng", text: "Đường Văn Tiến Dũng" },
              { value: "Đường Hoàng Quốc Việt", text: "Đường Hoàng Quốc Việt" },
              { value: "Đường Nguyễn Văn Giáp", text: "Đường Nguyễn Văn Giáp" },
              { value: "Đường Đức Diễn", text: "Đường Đức Diễn" },
            ],
          },
          {
            value: "Phường Minh Khai",
            text: "Phường Minh Khai",
            streets: [
              { value: "Đường Minh Khai", text: "Đường Minh Khai" },
              { value: "Đường Văn Tiến Dũng", text: "Đường Văn Tiến Dũng" },
              { value: "Đường Hoàng Tăng Bí", text: "Đường Hoàng Tăng Bí" },
              { value: "Đường Tân Xuân", text: "Đường Tân Xuân" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Lê Văn Hiến", text: "Đường Lê Văn Hiến" },
              { value: "Đường Xuân Đỉnh", text: "Đường Xuân Đỉnh" },
              { value: "Đường Đức Diễn", text: "Đường Đức Diễn" },
            ],
          },
          {
            value: "Phường Phú Diễn",
            text: "Phường Phú Diễn",
            streets: [
              { value: "Đường Phú Diễn", text: "Đường Phú Diễn" },
              { value: "Đường Cầu Noi", text: "Đường Cầu Noi" },
              { value: "Đường Văn Tiến Dũng", text: "Đường Văn Tiến Dũng" },
              { value: "Đường Nguyễn Văn Giáp", text: "Đường Nguyễn Văn Giáp" },
              { value: "Đường Tân Xuân", text: "Đường Tân Xuân" },
              { value: "Đường Hoàng Quốc Việt", text: "Đường Hoàng Quốc Việt" },
              { value: "Đường Đức Diễn", text: "Đường Đức Diễn" },
              { value: "Đường Minh Khai", text: "Đường Minh Khai" },
            ],
          },
          {
            value: "Phường Tây Tựu",
            text: "Phường Tây Tựu",
            streets: [
              { value: "Đường Tây Tựu", text: "Đường Tây Tựu" },
              { value: "Đường Phúc Diễn", text: "Đường Phúc Diễn" },
              { value: "Đường Văn Tiến Dũng", text: "Đường Văn Tiến Dũng" },
              { value: "Đường Cổ Nhuế", text: "Đường Cổ Nhuế" },
              { value: "Đường Tân Xuân", text: "Đường Tân Xuân" },
              { value: "Đường Đức Diễn", text: "Đường Đức Diễn" },
              { value: "Đường Lê Văn Hiến", text: "Đường Lê Văn Hiến" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
            ],
          },
          {
            value: "Phường Thụy Phương",
            text: "Phường Thụy Phương",
            streets: [
              { value: "Đường Thụy Phương", text: "Đường Thụy Phương" },
              { value: "Đường Cầu Noi", text: "Đường Cầu Noi" },
              { value: "Đường Văn Tiến Dũng", text: "Đường Văn Tiến Dũng" },
              { value: "Đường Hoàng Tăng Bí", text: "Đường Hoàng Tăng Bí" },
              { value: "Đường Minh Khai", text: "Đường Minh Khai" },
              { value: "Đường Đức Diễn", text: "Đường Đức Diễn" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Lê Văn Hiến", text: "Đường Lê Văn Hiến" },
            ],
          },
          {
            value: "Phường Xuân Đỉnh",
            text: "Phường Xuân Đỉnh",
            streets: [
              { value: "Đường Xuân Đỉnh", text: "Đường Xuân Đỉnh" },
              { value: "Đường Đông Ngạc", text: "Đường Đông Ngạc" },
              { value: "Đường Trần Cung", text: "Đường Trần Cung" },
              { value: "Đường Hoàng Quốc Việt", text: "Đường Hoàng Quốc Việt" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Cổ Nhuế", text: "Đường Cổ Nhuế" },
              { value: "Đường Tân Xuân", text: "Đường Tân Xuân" },
              { value: "Đường Lê Văn Hiến", text: "Đường Lê Văn Hiến" },
            ],
          },
        ],
      },
      {
        value: "Cầu Giấy",
        text: "Cầu Giấy",
        wards: [
          {
            value: "Phường Dịch Vọng",
            text: "Phường Dịch Vọng",
            streets: [
              { value: "Đường Trần Đăng Ninh", text: "Đường Trần Đăng Ninh" },
              {
                value: "Đường Nguyễn Khánh Toàn",
                text: "Đường Nguyễn Khánh Toàn",
              },
              { value: "Đường Thành Thái", text: "Đường Thành Thái" },
              { value: "Đường Chùa Hà", text: "Đường Chùa Hà" },
              { value: "Đường Xuân Thủy", text: "Đường Xuân Thủy" },
              { value: "Đường Dịch Vọng", text: "Đường Dịch Vọng" },
              { value: "Đường Trần Quốc Hoàn", text: "Đường Trần Quốc Hoàn" },
              { value: "Đường Khúc Thừa Dụ", text: "Đường Khúc Thừa Dụ" },
            ],
          },
          {
            value: "Phường Dịch Vọng Hậu",
            text: "Phường Dịch Vọng Hậu",
            streets: [
              { value: "Đường Xuân Thủy", text: "Đường Xuân Thủy" },
              { value: "Đường Trần Thái Tông", text: "Đường Trần Thái Tông" },
              { value: "Đường Cầu Giấy", text: "Đường Cầu Giấy" },
              {
                value: "Đường Nguyễn Văn Huyên",
                text: "Đường Nguyễn Văn Huyên",
              },
              { value: "Đường Trung Kính", text: "Đường Trung Kính" },
              { value: "Đường Thành Thái", text: "Đường Thành Thái" },
              { value: "Đường Tôn Thất Thuyết", text: "Đường Tôn Thất Thuyết" },
              { value: "Đường Phạm Hùng", text: "Đường Phạm Hùng" },
            ],
          },
          {
            value: "Phường Mai Dịch",
            text: "Phường Mai Dịch",
            streets: [
              { value: "Đường Hồ Tùng Mậu", text: "Đường Hồ Tùng Mậu" },
              { value: "Đường Nguyễn Cơ Thạch", text: "Đường Nguyễn Cơ Thạch" },
              { value: "Đường Doãn Kế Thiện", text: "Đường Doãn Kế Thiện" },
              { value: "Đường Trần Vỹ", text: "Đường Trần Vỹ" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Dương Khuê", text: "Đường Dương Khuê" },
              { value: "Đường Lê Đức Thọ", text: "Đường Lê Đức Thọ" },
              { value: "Đường Trần Bình", text: "Đường Trần Bình" },
            ],
          },
          {
            value: "Phường Nghĩa Đô",
            text: "Phường Nghĩa Đô",
            streets: [
              { value: "Đường Hoàng Quốc Việt", text: "Đường Hoàng Quốc Việt" },
              {
                value: "Đường Nguyễn Văn Huyên",
                text: "Đường Nguyễn Văn Huyên",
              },
              { value: "Đường Nghĩa Đô", text: "Đường Nghĩa Đô" },
              { value: "Đường Trần Cung", text: "Đường Trần Cung" },
              { value: "Đường Cầu Giấy", text: "Đường Cầu Giấy" },
              { value: "Đường Phùng Chí Kiên", text: "Đường Phùng Chí Kiên" },
              { value: "Đường Đội Cấn", text: "Đường Đội Cấn" },
              { value: "Đường Chùa Hà", text: "Đường Chùa Hà" },
            ],
          },
          {
            value: "Phường Nghĩa Tân",
            text: "Phường Nghĩa Tân",
            streets: [
              { value: "Đường Hoàng Quốc Việt", text: "Đường Hoàng Quốc Việt" },
              { value: "Đường Nghĩa Tân", text: "Đường Nghĩa Tân" },
              { value: "Đường Tô Hiệu", text: "Đường Tô Hiệu" },
              { value: "Đường Lạc Long Quân", text: "Đường Lạc Long Quân" },
              {
                value: "Đường Nguyễn Khánh Toàn",
                text: "Đường Nguyễn Khánh Toàn",
              },
              { value: "Đường Trần Tử Bình", text: "Đường Trần Tử Bình" },
              { value: "Đường Chùa Hà", text: "Đường Chùa Hà" },
              { value: "Đường Cầu Giấy", text: "Đường Cầu Giấy" },
            ],
          },
          {
            value: "Phường Quan Hoa",
            text: "Phường Quan Hoa",
            streets: [
              { value: "Đường Cầu Giấy", text: "Đường Cầu Giấy" },
              {
                value: "Đường Nguyễn Văn Huyên",
                text: "Đường Nguyễn Văn Huyên",
              },
              { value: "Đường Quan Hoa", text: "Đường Quan Hoa" },
              { value: "Đường Chùa Hà", text: "Đường Chùa Hà" },
              {
                value: "Đường Nguyễn Khánh Toàn",
                text: "Đường Nguyễn Khánh Toàn",
              },
              { value: "Đường Hoàng Quốc Việt", text: "Đường Hoàng Quốc Việt" },
              { value: "Đường Tô Hiệu", text: "Đường Tô Hiệu" },
              { value: "Đường Xuân Thủy", text: "Đường Xuân Thủy" },
            ],
          },
          {
            value: "Phường Trung Hòa",
            text: "Phường Trung Hòa",
            streets: [
              { value: "Đường Trung Hòa", text: "Đường Trung Hòa" },
              { value: "Đường Trung Kính", text: "Đường Trung Kính" },
              { value: "Đường Vũ Phạm Hàm", text: "Đường Vũ Phạm Hàm" },
              { value: "Đường Hoàng Ngân", text: "Đường Hoàng Ngân" },
              { value: "Đường Trần Duy Hưng", text: "Đường Trần Duy Hưng" },
              { value: "Đường Nguyễn Chánh", text: "Đường Nguyễn Chánh" },
              { value: "Đường Phạm Hùng", text: "Đường Phạm Hùng" },
              { value: "Đường Láng", text: "Đường Láng" },
            ],
          },
          {
            value: "Phường Yên Hòa",
            text: "Phường Yên Hòa",
            streets: [
              { value: "Đường Yên Hòa", text: "Đường Yên Hòa" },
              { value: "Đường Nguyễn Khang", text: "Đường Nguyễn Khang" },
              { value: "Đường Trung Kính", text: "Đường Trung Kính" },
              { value: "Đường Hoa Bằng", text: "Đường Hoa Bằng" },
              { value: "Đường Láng", text: "Đường Láng" },
              { value: "Đường Vũ Phạm Hàm", text: "Đường Vũ Phạm Hàm" },
              { value: "Đường Nguyễn Ngọc Vũ", text: "Đường Nguyễn Ngọc Vũ" },
              { value: "Đường Đường Lê Văn Lương", text: "Đường Lê Văn Lương" },
            ],
          },
        ],
      },
      {
        value: "Chương Mỹ",
        text: "Chương Mỹ",
        wards: [
          {
            value: "Xã Đại Yên",
            text: "Xã Đại Yên",
            streets: [
              { value: "Đường Đại Đồng", text: "Đường Đại Đồng" },
              { value: "Đường Đại Thắng", text: "Đường Đại Thắng" },
              { value: "Đường Tân An", text: "Đường Tân An" },
              { value: "Đường Tân Lập", text: "Đường Tân Lập" },
              { value: "Đường Độc Lập", text: "Đường Độc Lập" },
              { value: "Đường Thịnh Vượng", text: "Đường Thịnh Vượng" },
              { value: "Đường Hoàng Hoa Thám", text: "Đường Hoàng Hoa Thám" },
              { value: "Đường Bình Minh", text: "Đường Bình Minh" },
            ],
          },
          {
            value: "Xã Đồng Phú",
            text: "Xã Đồng Phú",
            streets: [
              { value: "Đường Đồng Tiến", text: "Đường Đồng Tiến" },
              { value: "Đường Phú Lương", text: "Đường Phú Lương" },
              { value: "Đường Xuân Phú", text: "Đường Xuân Phú" },
              { value: "Đường Phú Nghĩa", text: "Đường Phú Nghĩa" },
              { value: "Đường Đồng Tâm", text: "Đường Đồng Tâm" },
              { value: "Đường Tân Thịnh", text: "Đường Tân Thịnh" },
              { value: "Đường Bình An", text: "Đường Bình An" },
              { value: "Đường Hạnh Phúc", text: "Đường Hạnh Phúc" },
            ],
          },
          {
            value: "Xã Hữu Văn",
            text: "Xã Hữu Văn",
            streets: [
              { value: "Đường Văn Minh", text: "Đường Văn Minh" },
              { value: "Đường Văn Khê", text: "Đường Văn Khê" },
              { value: "Đường Văn Bình", text: "Đường Văn Bình" },
              { value: "Đường Văn An", text: "Đường Văn An" },
              { value: "Đường Văn Phú", text: "Đường Văn Phú" },
              { value: "Đường Văn Hòa", text: "Đường Văn Hòa" },
              { value: "Đường Văn Thành", text: "Đường Văn Thành" },
              { value: "Đường Văn Hiến", text: "Đường Văn Hiến" },
            ],
          },
          {
            value: "Xã Phụng Châu",
            text: "Xã Phụng Châu",
            streets: [
              { value: "Đường Phụng Lộc", text: "Đường Phụng Lộc" },
              { value: "Đường Châu Sơn", text: "Đường Châu Sơn" },
              { value: "Đường Đại Phong", text: "Đường Đại Phong" },
              { value: "Đường Đại Hòa", text: "Đường Đại Hòa" },
              { value: "Đường Phụng Nghĩa", text: "Đường Phụng Nghĩa" },
              { value: "Đường Đại An", text: "Đường Đại An" },
              { value: "Đường Phụng Hưng", text: "Đường Phụng Hưng" },
              { value: "Đường Phụng Vỹ", text: "Đường Phụng Vỹ" },
            ],
          },
          {
            value: "Xã Đông Sơn",
            text: "Xã Đông Sơn",
            streets: [
              { value: "Đường Đông Hòa", text: "Đường Đông Hòa" },
              { value: "Đường Đông Lâm", text: "Đường Đông Lâm" },
              { value: "Đường Đông Phú", text: "Đường Đông Phú" },
              { value: "Đường Đông Thành", text: "Đường Đông Thành" },
              { value: "Đường Đông Thái", text: "Đường Đông Thái" },
              { value: "Đường Đông Tân", text: "Đường Đông Tân" },
              { value: "Đường Đông Bình", text: "Đường Đông Bình" },
              { value: "Đường Đông Lạc", text: "Đường Đông Lạc" },
            ],
          },
          {
            value: "Xã Trường Yên",
            text: "Xã Trường Yên",
            streets: [
              { value: "Đường Trường Lâm", text: "Đường Trường Lâm" },
              { value: "Đường Trường An", text: "Đường Trường An" },
              { value: "Đường Yên Thái", text: "Đường Yên Thái" },
              { value: "Đường Yên Phú", text: "Đường Yên Phú" },
              { value: "Đường Yên Hòa", text: "Đường Yên Hòa" },
              { value: "Đường Trường Thành", text: "Đường Trường Thành" },
              { value: "Đường Yên Tĩnh", text: "Đường Yên Tĩnh" },
              { value: "Đường Trường Lộc", text: "Đường Trường Lộc" },
            ],
          },
          {
            value: "Xã Ngọc Hòa",
            text: "Xã Ngọc Hòa",
            streets: [
              { value: "Đường Ngọc Phú", text: "Đường Ngọc Phú" },
              { value: "Đường Hòa Lộc", text: "Đường Hòa Lộc" },
              { value: "Đường Ngọc Minh", text: "Đường Ngọc Minh" },
              { value: "Đường Ngọc An", text: "Đường Ngọc An" },
              { value: "Đường Hòa Bình", text: "Đường Hòa Bình" },
              { value: "Đường Hòa Tân", text: "Đường Hòa Tân" },
              { value: "Đường Ngọc Thái", text: "Đường Ngọc Thái" },
              { value: "Đường Hòa Thịnh", text: "Đường Hòa Thịnh" },
            ],
          },
          {
            value: "Xã Tiên Phương",
            text: "Xã Tiên Phương",
            streets: [
              { value: "Đường Tiên Lộc", text: "Đường Tiên Lộc" },
              { value: "Đường Tiên Thắng", text: "Đường Tiên Thắng" },
              { value: "Đường Tiên An", text: "Đường Tiên An" },
              { value: "Đường Phương Lâm", text: "Đường Phương Lâm" },
              { value: "Đường Phương Nam", text: "Đường Phương Nam" },
              { value: "Đường Phương Bắc", text: "Đường Phương Bắc" },
              { value: "Đường Tiên Hòa", text: "Đường Tiên Hòa" },
              { value: "Đường Tiên Minh", text: "Đường Tiên Minh" },
            ],
          },
        ],
      },
      {
        value: "Đan Phượng",
        text: "Đan Phượng",
        wards: [
          {
            value: "Xã An Thượng",
            text: "Xã An Thượng",
            streets: [
              { value: "Đường An Bình", text: "Đường An Bình" },
              { value: "Đường An Hòa", text: "Đường An Hòa" },
              { value: "Đường An Khánh", text: "Đường An Khánh" },
              { value: "Đường An Lạc", text: "Đường An Lạc" },
              { value: "Đường An Ngọc", text: "Đường An Ngọc" },
              { value: "Đường An Phú", text: "Đường An Phú" },
              { value: "Đường An Quang", text: "Đường An Quang" },
              { value: "Đường An Tâm", text: "Đường An Tâm" },
            ],
          },
          {
            value: "Xã Cổ Loa",
            text: "Xã Cổ Loa",
            streets: [
              { value: "Đường Cổ Loa", text: "Đường Cổ Loa" },
              { value: "Đường Loa Sơn", text: "Đường Loa Sơn" },
              { value: "Đường Cổ Minh", text: "Đường Cổ Minh" },
              { value: "Đường Cổ Pháp", text: "Đường Cổ Pháp" },
              { value: "Đường Long Biên", text: "Đường Long Biên" },
              { value: "Đường Cổ Thắng", text: "Đường Cổ Thắng" },
              { value: "Đường Cổ Lâm", text: "Đường Cổ Lâm" },
              { value: "Đường Thái Bình", text: "Đường Thái Bình" },
            ],
          },
          {
            value: "Xã Đức Thượng",
            text: "Xã Đức Thượng",
            streets: [
              { value: "Đường Đức Thịnh", text: "Đường Đức Thịnh" },
              { value: "Đường Đức Hòa", text: "Đường Đức Hòa" },
              { value: "Đường Đức Phú", text: "Đường Đức Phú" },
              { value: "Đường Đức Quang", text: "Đường Đức Quang" },
              { value: "Đường Đức Sơn", text: "Đường Đức Sơn" },
              { value: "Đường Đức Vĩnh", text: "Đường Đức Vĩnh" },
              { value: "Đường Đức Tiến", text: "Đường Đức Tiến" },
              { value: "Đường Đức Khánh", text: "Đường Đức Khánh" },
            ],
          },
          {
            value: "Xã Đông Thái",
            text: "Xã Đông Thái",
            streets: [
              { value: "Đường Đông Hòa", text: "Đường Đông Hòa" },
              { value: "Đường Đông Minh", text: "Đường Đông Minh" },
              { value: "Đường Đông Sơn", text: "Đường Đông Sơn" },
              { value: "Đường Đông Phương", text: "Đường Đông Phương" },
              { value: "Đường Đông Lộc", text: "Đường Đông Lộc" },
              { value: "Đường Đông Vinh", text: "Đường Đông Vinh" },
              { value: "Đường Đông Bảo", text: "Đường Đông Bảo" },
              { value: "Đường Đông Tân", text: "Đường Đông Tân" },
            ],
          },
          {
            value: "Xã Liên Hà",
            text: "Xã Liên Hà",
            streets: [
              { value: "Đường Liên Phúc", text: "Đường Liên Phúc" },
              { value: "Đường Liên Châu", text: "Đường Liên Châu" },
              { value: "Đường Liên Tài", text: "Đường Liên Tài" },
              { value: "Đường Liên Dương", text: "Đường Liên Dương" },
              { value: "Đường Liên Long", text: "Đường Liên Long" },
              { value: "Đường Liên Hòa", text: "Đường Liên Hòa" },
              { value: "Đường Liên Khánh", text: "Đường Liên Khánh" },
              { value: "Đường Liên Thành", text: "Đường Liên Thành" },
            ],
          },
          {
            value: "Xã Tân Hội",
            text: "Xã Tân Hội",
            streets: [
              { value: "Đường Tân Phú", text: "Đường Tân Phú" },
              { value: "Đường Tân Lộc", text: "Đường Tân Lộc" },
              { value: "Đường Tân Hòa", text: "Đường Tân Hòa" },
              { value: "Đường Tân Sơn", text: "Đường Tân Sơn" },
              { value: "Đường Tân Quang", text: "Đường Tân Quang" },
              { value: "Đường Tân Bình", text: "Đường Tân Bình" },
              { value: "Đường Tân Hưng", text: "Đường Tân Hưng" },
              { value: "Đường Tân Thịnh", text: "Đường Tân Thịnh" },
            ],
          },
          {
            value: "Xã Thanh Mỹ",
            text: "Xã Thanh Mỹ",
            streets: [
              { value: "Đường Thanh Bình", text: "Đường Thanh Bình" },
              { value: "Đường Thanh Hòa", text: "Đường Thanh Hòa" },
              { value: "Đường Thanh Lộc", text: "Đường Thanh Lộc" },
              { value: "Đường Thanh Sơn", text: "Đường Thanh Sơn" },
              { value: "Đường Thanh Tâm", text: "Đường Thanh Tâm" },
              { value: "Đường Thanh Quang", text: "Đường Thanh Quang" },
              { value: "Đường Thanh Khai", text: "Đường Thanh Khai" },
              { value: "Đường Thanh Vinh", text: "Đường Thanh Vinh" },
            ],
          },
          {
            value: "Xã Thượng Mỗ",
            text: "Xã Thượng Mỗ",
            streets: [
              { value: "Đường Thượng Hòa", text: "Đường Thượng Hòa" },
              { value: "Đường Thượng Sơn", text: "Đường Thượng Sơn" },
              { value: "Đường Thượng An", text: "Đường Thượng An" },
              { value: "Đường Thượng Quang", text: "Đường Thượng Quang" },
              { value: "Đường Thượng Thành", text: "Đường Thượng Thành" },
              { value: "Đường Thượng Thịnh", text: "Đường Thượng Thịnh" },
              { value: "Đường Thượng Liên", text: "Đường Thượng Liên" },
              { value: "Đường Thượng Tiến", text: "Đường Thượng Tiến" },
            ],
          },
        ],
      },
      {
        value: "Đông Anh",
        text: "Đông Anh",
        wards: [
          {
            value: "Xã Bắc Hồng",
            text: "Xã Bắc Hồng",
            streets: [
              { value: "Đường Bắc Sơn", text: "Đường Bắc Sơn" },
              { value: "Đường Bắc Tiến", text: "Đường Bắc Tiến" },
              { value: "Đường Bắc Thắng", text: "Đường Bắc Thắng" },
              { value: "Đường Bắc Cường", text: "Đường Bắc Cường" },
              { value: "Đường Bắc Lâm", text: "Đường Bắc Lâm" },
              { value: "Đường Bắc Hòa", text: "Đường Bắc Hòa" },
              { value: "Đường Bắc Đông", text: "Đường Bắc Đông" },
              { value: "Đường Bắc Minh", text: "Đường Bắc Minh" },
            ],
          },
          {
            value: "Xã Cổ Loa",
            text: "Xã Cổ Loa",
            streets: [
              { value: "Đường Cổ Loa", text: "Đường Cổ Loa" },
              { value: "Đường Cổ Sơn", text: "Đường Cổ Sơn" },
              { value: "Đường Cổ Thắng", text: "Đường Cổ Thắng" },
              { value: "Đường Cổ An", text: "Đường Cổ An" },
              { value: "Đường Cổ Mậu", text: "Đường Cổ Mậu" },
              { value: "Đường Cổ Lâm", text: "Đường Cổ Lâm" },
              { value: "Đường Cổ Pháp", text: "Đường Cổ Pháp" },
              { value: "Đường Cổ Tiến", text: "Đường Cổ Tiến" },
            ],
          },
          {
            value: "Xã Đức Hòa",
            text: "Xã Đức Hòa",
            streets: [
              { value: "Đường Đức Thắng", text: "Đường Đức Thắng" },
              { value: "Đường Đức Vĩnh", text: "Đường Đức Vĩnh" },
              { value: "Đường Đức Khánh", text: "Đường Đức Khánh" },
              { value: "Đường Đức Hòa", text: "Đường Đức Hòa" },
              { value: "Đường Đức Sơn", text: "Đường Đức Sơn" },
              { value: "Đường Đức Tiến", text: "Đường Đức Tiến" },
              { value: "Đường Đức Quang", text: "Đường Đức Quang" },
              { value: "Đường Đức Lâm", text: "Đường Đức Lâm" },
            ],
          },
          {
            value: "Xã Kim Chung",
            text: "Xã Kim Chung",
            streets: [
              { value: "Đường Kim Sơn", text: "Đường Kim Sơn" },
              { value: "Đường Kim Lâm", text: "Đường Kim Lâm" },
              { value: "Đường Kim Tân", text: "Đường Kim Tân" },
              { value: "Đường Kim Quang", text: "Đường Kim Quang" },
              { value: "Đường Kim Phúc", text: "Đường Kim Phúc" },
              { value: "Đường Kim Bảo", text: "Đường Kim Bảo" },
              { value: "Đường Kim Thịnh", text: "Đường Kim Thịnh" },
              { value: "Đường Kim Tiến", text: "Đường Kim Tiến" },
            ],
          },
          {
            value: "Xã Mai Lâm",
            text: "Xã Mai Lâm",
            streets: [
              { value: "Đường Mai Sơn", text: "Đường Mai Sơn" },
              { value: "Đường Mai Linh", text: "Đường Mai Linh" },
              { value: "Đường Mai Lâm", text: "Đường Mai Lâm" },
              { value: "Đường Mai Tiến", text: "Đường Mai Tiến" },
              { value: "Đường Mai Quang", text: "Đường Mai Quang" },
              { value: "Đường Mai Dương", text: "Đường Mai Dương" },
              { value: "Đường Mai Thanh", text: "Đường Mai Thanh" },
              { value: "Đường Mai Hòa", text: "Đường Mai Hòa" },
            ],
          },
          {
            value: "Xã Nam Hồng",
            text: "Xã Nam Hồng",
            streets: [
              { value: "Đường Nam Sơn", text: "Đường Nam Sơn" },
              { value: "Đường Nam Linh", text: "Đường Nam Linh" },
              { value: "Đường Nam Thịnh", text: "Đường Nam Thịnh" },
              { value: "Đường Nam Vĩnh", text: "Đường Nam Vĩnh" },
              { value: "Đường Nam Hòa", text: "Đường Nam Hòa" },
              { value: "Đường Nam Tân", text: "Đường Nam Tân" },
              { value: "Đường Nam Quang", text: "Đường Nam Quang" },
              { value: "Đường Nam Lâm", text: "Đường Nam Lâm" },
            ],
          },
          {
            value: "Xã Tàm Xá",
            text: "Xã Tàm Xá",
            streets: [
              { value: "Đường Tàm Sơn", text: "Đường Tàm Sơn" },
              { value: "Đường Tàm Hòa", text: "Đường Tàm Hòa" },
              { value: "Đường Tàm Tiến", text: "Đường Tàm Tiến" },
              { value: "Đường Tàm Lâm", text: "Đường Tàm Lâm" },
              { value: "Đường Tàm Thanh", text: "Đường Tàm Thanh" },
              { value: "Đường Tàm Tiến", text: "Đường Tàm Tiến" },
              { value: "Đường Tàm Quang", text: "Đường Tàm Quang" },
              { value: "Đường Tàm Minh", text: "Đường Tàm Minh" },
            ],
          },
          {
            value: "Xã Uy Nỗ",
            text: "Xã Uy Nỗ",
            streets: [
              { value: "Đường Uy Tiến", text: "Đường Uy Tiến" },
              { value: "Đường Uy Hòa", text: "Đường Uy Hòa" },
              { value: "Đường Uy Sơn", text: "Đường Uy Sơn" },
              { value: "Đường Uy Minh", text: "Đường Uy Minh" },
              { value: "Đường Uy Lâm", text: "Đường Uy Lâm" },
              { value: "Đường Uy Quang", text: "Đường Uy Quang" },
              { value: "Đường Uy Thanh", text: "Đường Uy Thanh" },
              { value: "Đường Uy An", text: "Đường Uy An" },
            ],
          },
        ],
      },
    ],
    DaNang: [
      {
        value: "Cẩm Lệ",
        text: "Cẩm Lệ",
        wards: [
          {
            value: "Hòa Phát",
            text: "Phường Hòa Phát",
            streets: [
              { value: "Đường Nguyễn Hữu Thọ", text: "Đường Nguyễn Hữu Thọ" },
              { value: "Đường Hồ Xuân Hương", text: "Đường Hồ Xuân Hương" },
              { value: "Đường Lê Đại Hành", text: "Đường Lê Đại Hành" },
              {
                value: "Đường Kinh Dương Vương",
                text: "Đường Kinh Dương Vương",
              },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
              { value: "Đường Tôn Thất Tùng", text: "Đường Tôn Thất Tùng" },
              { value: "Đường Trần Thái Tông", text: "Đường Trần Thái Tông" },
            ],
          },
          {
            value: "Phường Hòa Xuân",
            text: "Phường Hòa Xuân",
            streets: [
              { value: "Đường Hòa Xuân", text: "Đường Hòa Xuân" },
              { value: "Đường Tôn Đức Thắng", text: "Đường Tôn Đức Thắng" },
              {
                value: "Đường Cách Mạng Tháng Tám",
                text: "Đường Cách Mạng Tháng Tám",
              },
              { value: "Đường Bạch Đằng", text: "Đường Bạch Đằng" },
              {
                value: "Đường Nguyễn Chí Thanh",
                text: "Đường Nguyễn Chí Thanh",
              },
              { value: "Đường Lê Thanh Nghị", text: "Đường Lê Thanh Nghị" },
              {
                value: "Đường Nguyễn Quang Bích",
                text: "Đường Nguyễn Quang Bích",
              },
              { value: "Đường Vũ Quang", text: "Đường Vũ Quang" },
            ],
          },
          {
            value: "Phường Khuê Trung",
            text: "Phường Khuê Trung",
            streets: [
              { value: "Đường Khuê Trung", text: "Đường Khuê Trung" },
              {
                value: "Đường Nguyễn Tri Phương",
                text: "Đường Nguyễn Tri Phương",
              },
              { value: "Đường Cầu Giấy", text: "Đường Cầu Giấy" },
              { value: "Đường Phan Chu Trinh", text: "Đường Phan Chu Trinh" },
              { value: "Đường Võ Văn Kiệt", text: "Đường Võ Văn Kiệt" },
              { value: "Đường Hòa Minh", text: "Đường Hòa Minh" },
              { value: "Đường Ngô Quyền", text: "Đường Ngô Quyền" },
              { value: "Đường Đoàn Thị Điểm", text: "Đường Đoàn Thị Điểm" },
            ],
          },
          {
            value: "Phường Tây Bắc",
            text: "Phường Tây Bắc",
            streets: [
              { value: "Đường Tây Bắc", text: "Đường Tây Bắc" },
              { value: "Đường Lý Thường Kiệt", text: "Đường Lý Thường Kiệt" },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
              { value: "Đường Trần Quý Cáp", text: "Đường Trần Quý Cáp" },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường Hoàng Diệu", text: "Đường Hoàng Diệu" },
              { value: "Đường Hoàng Văn Thụ", text: "Đường Hoàng Văn Thụ" },
              { value: "Đường Cao Thắng", text: "Đường Cao Thắng" },
            ],
          },
          {
            value: "Phường Hòa An",
            text: "Phường Hòa An",
            streets: [
              { value: "Đường Hòa An", text: "Đường Hòa An" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Đặng Thai Mai", text: "Đường Đặng Thai Mai" },
              { value: "Đường Đỗ Quang", text: "Đường Đỗ Quang" },
              {
                value: "Đường Nguyễn Bỉnh Khiêm",
                text: "Đường Nguyễn Bỉnh Khiêm",
              },
              { value: "Đường Tô Hiệu", text: "Đường Tô Hiệu" },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
              { value: "Đường Lê Đức Thọ", text: "Đường Lê Đức Thọ" },
            ],
          },
          {
            value: "Phường Hoà Vang",
            text: "Phường Hoà Vang",
            streets: [
              { value: "Đường Hoà Vang", text: "Đường Hoà Vang" },
              { value: "Đường Lê Thị Hồng Gấm", text: "Đường Lê Thị Hồng Gấm" },
              { value: "Đường Dương Đình Nghệ", text: "Đường Dương Đình Nghệ" },
              {
                value: "Đường Nguyễn Chí Thanh",
                text: "Đường Nguyễn Chí Thanh",
              },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường Nguyễn Công Trứ", text: "Đường Nguyễn Công Trứ" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Trương Định", text: "Đường Trương Định" },
            ],
          },
          {
            value: "Phường Nam Dương",
            text: "Phường Nam Dương",
            streets: [
              { value: "Đường Nam Dương", text: "Đường Nam Dương" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Trần Bình Trọng", text: "Đường Trần Bình Trọng" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
              {
                value: "Đường Nguyễn Trường Tộ",
                text: "Đường Nguyễn Trường Tộ",
              },
              {
                value: "Đường Cách Mạng Tháng Tám",
                text: "Đường Cách Mạng Tháng Tám",
              },
              {
                value: "Đường Nguyễn Quang Bích",
                text: "Đường Nguyễn Quang Bích",
              },
              { value: "Đường Vũ Quang", text: "Đường Vũ Quang" },
            ],
          },
          {
            value: "Phường Chương Dương",
            text: "Phường Chương Dương",
            streets: [
              { value: "Đường Chương Dương", text: "Đường Chương Dương" },
              { value: "Đường Phan Chu Trinh", text: "Đường Phan Chu Trinh" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Lê Đại Hành", text: "Đường Lê Đại Hành" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Nguyễn Công Trứ", text: "Đường Nguyễn Công Trứ" },
              { value: "Đường Trần Quý Cáp", text: "Đường Trần Quý Cáp" },
              { value: "Đường Quang Trung", text: "Đường Quang Trung" },
            ],
          },
        ],
      },
      {
        value: "Hải Châu",
        text: "Hải Châu",
        wards: [
          {
            value: "Phường Phước Ninh",
            text: "Phường Phước Ninh",
            streets: [
              { value: "Đường Phan Châu Trinh", text: "Đường Phan Châu Trinh" },
              { value: "Đường Lê Đình Lý", text: "Đường Lê Đình Lý" },
              { value: "Đường Nguyễn Hữu Thọ", text: "Đường Nguyễn Hữu Thọ" },
              {
                value: "Đường Nguyễn Chí Thanh",
                text: "Đường Nguyễn Chí Thanh",
              },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
              { value: "Đường Tôn Đức Thắng", text: "Đường Tôn Đức Thắng" },
              { value: "Đường Bạch Đằng", text: "Đường Bạch Đằng" },
              { value: "Đường Ngô Quyền", text: "Đường Ngô Quyền" },
            ],
          },
          {
            value: "Phường Hòa Thuận Đông",
            text: "Phường Hòa Thuận Đông",
            streets: [
              { value: "Đường Hòa Thuận", text: "Đường Hòa Thuận" },
              { value: "Đường Lý Tự Trọng", text: "Đường Lý Tự Trọng" },
              { value: "Đường Ngô Quyền", text: "Đường Ngô Quyền" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Trần Quý Cáp", text: "Đường Trần Quý Cáp" },
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường Nguyễn Công Trứ", text: "Đường Nguyễn Công Trứ" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
            ],
          },
          {
            value: "Phường Hòa Thuận Tây",
            text: "Phường Hòa Thuận Tây",
            streets: [
              { value: "Đường Hòa Thuận Tây", text: "Đường Hòa Thuận Tây" },
              { value: "Đường Tôn Đức Thắng", text: "Đường Tôn Đức Thắng" },
              { value: "Đường Lê Duẩn", text: "Đường Lê Duẩn" },
              { value: "Đường Quang Trung", text: "Đường Quang Trung" },
              { value: "Đường Trần Đình Hữu", text: "Đường Trần Đình Hữu" },
              { value: "Đường Võ Văn Kiệt", text: "Đường Võ Văn Kiệt" },
              { value: "Đường Nguyễn Thái Học", text: "Đường Nguyễn Thái Học" },
              { value: "Đường Hoàng Diệu", text: "Đường Hoàng Diệu" },
            ],
          },
          {
            value: "Phường Thanh Bình",
            text: "Phường Thanh Bình",
            streets: [
              { value: "Đường Thanh Bình", text: "Đường Thanh Bình" },
              { value: "Đường Bạch Đằng", text: "Đường Bạch Đằng" },
              { value: "Đường Phan Châu Trinh", text: "Đường Phan Châu Trinh" },
              { value: "Đường Nguyễn Hữu Thọ", text: "Đường Nguyễn Hữu Thọ" },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
              { value: "Đường Lê Duẩn", text: "Đường Lê Duẩn" },
              { value: "Đường Quang Trung", text: "Đường Quang Trung" },
              { value: "Đường Nguyễn Công Trứ", text: "Đường Nguyễn Công Trứ" },
            ],
          },
          {
            value: "Phường Thạch Thang",
            text: "Phường Thạch Thang",
            streets: [
              { value: "Đường Thạch Thang", text: "Đường Thạch Thang" },
              { value: "Đường Nguyễn Hữu Thọ", text: "Đường Nguyễn Hữu Thọ" },
              { value: "Đường Bạch Đằng", text: "Đường Bạch Đằng" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
              { value: "Đường Ngô Quyền", text: "Đường Ngô Quyền" },
              { value: "Đường Tôn Đức Thắng", text: "Đường Tôn Đức Thắng" },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
              { value: "Đường Nguyễn Thái Học", text: "Đường Nguyễn Thái Học" },
            ],
          },
          {
            value: "Phường Chính Gián",
            text: "Phường Chính Gián",
            streets: [
              { value: "Đường Chính Gián", text: "Đường Chính Gián" },
              { value: "Đường Phan Chu Trinh", text: "Đường Phan Chu Trinh" },
              {
                value: "Đường Nguyễn Chí Thanh",
                text: "Đường Nguyễn Chí Thanh",
              },
              { value: "Đường Đống Đa", text: "Đường Đống Đa" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Trần Bình Trọng", text: "Đường Trần Bình Trọng" },
              { value: "Đường Lê Thanh Nghị", text: "Đường Lê Thanh Nghị" },
              { value: "Đường Lý Thường Kiệt", text: "Đường Lý Thường Kiệt" },
            ],
          },
          {
            value: "Phường Thọ Quang",
            text: "Phường Thọ Quang",
            streets: [
              { value: "Đường Thọ Quang", text: "Đường Thọ Quang" },
              {
                value: "Đường Nguyễn Chí Thanh",
                text: "Đường Nguyễn Chí Thanh",
              },
              { value: "Đường Võ Văn Kiệt", text: "Đường Võ Văn Kiệt" },
              { value: "Đường Đỗ Quang", text: "Đường Đỗ Quang" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường Trần Quý Cáp", text: "Đường Trần Quý Cáp" },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
            ],
          },
          {
            value: "Phường Mân Thái",
            text: "Phường Mân Thái",
            streets: [
              { value: "Đường Mân Thái", text: "Đường Mân Thái" },
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường Hoàng Diệu", text: "Đường Hoàng Diệu" },
              { value: "Đường Đỗ Quang", text: "Đường Đỗ Quang" },
              { value: "Đường Ngô Quyền", text: "Đường Ngô Quyền" },
              {
                value: "Đường Cách Mạng Tháng Tám",
                text: "Đường Cách Mạng Tháng Tám",
              },
              {
                value: "Đường Trần Thiện Chánh",
                text: "Đường Trần Thiện Chánh",
              },
              { value: "Đường Lê Thị Hồng Gấm", text: "Đường Lê Thị Hồng Gấm" },
            ],
          },
        ],
      },
      {
        value: "Hòa Vang",
        text: "Hòa Vang",
        wards: [
          {
            value: "Xã Hòa Phú",
            text: "Xã Hòa Phú",
            streets: [
              { value: "Đường Hòa Phú", text: "Đường Hòa Phú" },
              { value: "Đường Đinh Công Tráng", text: "Đường Đinh Công Tráng" },
              { value: "Đường Nguyễn Thái Học", text: "Đường Nguyễn Thái Học" },
              { value: "Đường Trường Sa", text: "Đường Trường Sa" },
              { value: "Đường Nguyễn Công Trứ", text: "Đường Nguyễn Công Trứ" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Hoàng Diệu", text: "Đường Hoàng Diệu" },
              { value: "Đường Lê Quang Đạo", text: "Đường Lê Quang Đạo" },
            ],
          },
          {
            value: "Xã Hòa Khương",
            text: "Xã Hòa Khương",
            streets: [
              { value: "Đường Hòa Khương", text: "Đường Hòa Khương" },
              { value: "Đường Quốc lộ 1A", text: "Đường Quốc lộ 1A" },
              { value: "Đường Nguyễn Hữu Thọ", text: "Đường Nguyễn Hữu Thọ" },
              { value: "Đường Hoàng Diệu", text: "Đường Hoàng Diệu" },
              { value: "Đường Trần Quý Cáp", text: "Đường Trần Quý Cáp" },
              { value: "Đường Lê Đức Thọ", text: "Đường Lê Đức Thọ" },
              { value: "Đường Quang Trung", text: "Đường Quang Trung" },
              {
                value: "Đường Trần Thiện Chánh",
                text: "Đường Trần Thiện Chánh",
              },
            ],
          },
          {
            value: "Xã Hòa Sơn",
            text: "Xã Hòa Sơn",
            streets: [
              { value: "Đường Hòa Sơn", text: "Đường Hòa Sơn" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              {
                value: "Đường Nguyễn Chí Thanh",
                text: "Đường Nguyễn Chí Thanh",
              },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
              { value: "Đường Phạm Ngọc Thạch", text: "Đường Phạm Ngọc Thạch" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Nguyễn Công Trứ", text: "Đường Nguyễn Công Trứ" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
            ],
          },
          {
            value: "Xã Hòa Nhơn",
            text: "Xã Hòa Nhơn",
            streets: [
              { value: "Đường Hòa Nhơn", text: "Đường Hòa Nhơn" },
              { value: "Đường Quốc lộ 14B", text: "Đường Quốc lộ 14B" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Quang Trung", text: "Đường Quang Trung" },
              { value: "Đường Trần Bình Trọng", text: "Đường Trần Bình Trọng" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
              { value: "Đường Lê Văn Duyệt", text: "Đường Lê Văn Duyệt" },
            ],
          },
          {
            value: "Xã Hòa Tiến",
            text: "Xã Hòa Tiến",
            streets: [
              { value: "Đường Hòa Tiến", text: "Đường Hòa Tiến" },
              { value: "Đường Trần Quý Cáp", text: "Đường Trần Quý Cáp" },
              { value: "Đường Lê Duẩn", text: "Đường Lê Duẩn" },
              { value: "Đường Quang Trung", text: "Đường Quang Trung" },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
              { value: "Đường Phạm Ngọc Thạch", text: "Đường Phạm Ngọc Thạch" },
              { value: "Đường Nguyễn Công Trứ", text: "Đường Nguyễn Công Trứ" },
              { value: "Đường Lý Thường Kiệt", text: "Đường Lý Thường Kiệt" },
            ],
          },
          {
            value: "Xã Hòa Ninh",
            text: "Xã Hòa Ninh",
            streets: [
              { value: "Đường Hòa Ninh", text: "Đường Hòa Ninh" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
              { value: "Đường Bạch Đằng", text: "Đường Bạch Đằng" },
              { value: "Đường Đoàn Kết", text: "Đường Đoàn Kết" },
              { value: "Đường Nguyễn Công Trứ", text: "Đường Nguyễn Công Trứ" },
            ],
          },
          {
            value: "Xã Hòa Phước",
            text: "Xã Hòa Phước",
            streets: [
              { value: "Đường Hòa Phước", text: "Đường Hòa Phước" },
              { value: "Đường Nguyễn Công Trứ", text: "Đường Nguyễn Công Trứ" },
              { value: "Đường Đoàn Kết", text: "Đường Đoàn Kết" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
              { value: "Đường Quang Trung", text: "Đường Quang Trung" },
            ],
          },
          {
            value: "Xã Hòa Sơn",
            text: "Xã Hòa Sơn",
            streets: [
              { value: "Đường Hòa Sơn", text: "Đường Hòa Sơn" },
              { value: "Đường Quang Trung", text: "Đường Quang Trung" },
              { value: "Đường Nguyễn Thái Học", text: "Đường Nguyễn Thái Học" },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Lê Thanh Nghị", text: "Đường Lê Thanh Nghị" },
              { value: "Đường Nguyễn Công Trứ", text: "Đường Nguyễn Công Trứ" },
            ],
          },
        ],
      },
      {
        value: "Hoàng Sa",
        text: "Hoàng Sa",
        wards: [
          {
            value: "Đảo Lý Sơn",
            text: "Đảo Lý Sơn",
            streets: [
              { value: "Đường Trường Sa", text: "Đường Trường Sa" },
              { value: "Đường Lý Sơn", text: "Đường Lý Sơn" },
              { value: "Đường Đảo Lý Sơn", text: "Đường Đảo Lý Sơn" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Hải Sơn", text: "Đường Hải Sơn" },
              { value: "Đường Thăng Long", text: "Đường Thăng Long" },
              { value: "Đường Biển Đông", text: "Đường Biển Đông" },
              { value: "Đường Bạch Đằng", text: "Đường Bạch Đằng" },
            ],
          },
          {
            value: "Đảo Hoàng Sa",
            text: "Đảo Hoàng Sa",
            streets: [
              { value: "Đường Hoàng Sa", text: "Đường Hoàng Sa" },
              { value: "Đường Tùng Dương", text: "Đường Tùng Dương" },
              { value: "Đường Dương Tự Quán", text: "Đường Dương Tự Quán" },
              { value: "Đường Bình Minh", text: "Đường Bình Minh" },
              { value: "Đường Bình An", text: "Đường Bình An" },
              { value: "Đường Nguyễn Công Trứ", text: "Đường Nguyễn Công Trứ" },
              { value: "Đường Nguyễn Thái Học", text: "Đường Nguyễn Thái Học" },
              { value: "Đường Thượng Hải", text: "Đường Thượng Hải" },
            ],
          },
          {
            value: "Đảo Cù Lao Chàm",
            text: "Đảo Cù Lao Chàm",
            streets: [
              { value: "Đường Cù Lao Chàm", text: "Đường Cù Lao Chàm" },
              { value: "Đường Bãi Hương", text: "Đường Bãi Hương" },
              { value: "Đường Bãi Làng", text: "Đường Bãi Làng" },
              { value: "Đường Bãi Xép", text: "Đường Bãi Xép" },
              { value: "Đường Đảo Cù Lao", text: "Đường Đảo Cù Lao" },
              { value: "Đường Làng Chài", text: "Đường Làng Chài" },
              { value: "Đường Tân Thành", text: "Đường Tân Thành" },
              { value: "Đường Hòa Bình", text: "Đường Hòa Bình" },
            ],
          },
          {
            value: "Đảo An Bàng",
            text: "Đảo An Bàng",
            streets: [
              { value: "Đường An Bàng", text: "Đường An Bàng" },
              { value: "Đường Mộng Cát", text: "Đường Mộng Cát" },
              { value: "Đường Bãi An Bàng", text: "Đường Bãi An Bàng" },
              { value: "Đường Đảo An Bàng", text: "Đường Đảo An Bàng" },
              { value: "Đường Cát Hải", text: "Đường Cát Hải" },
              { value: "Đường Tân Bình", text: "Đường Tân Bình" },
              { value: "Đường Hương Lộ", text: "Đường Hương Lộ" },
              { value: "Đường Xuân Viên", text: "Đường Xuân Viên" },
            ],
          },
        ],
      },
      {
        value: "Liên Chiểu",
        text: "Liên Chiểu",
        wards: [
          {
            value: "Hoa Minh",
            text: "Phường Hòa Minh",
            streets: [
              { value: "Đường 14", text: "Đường 14" },
              { value: "Đường Hòa Minh 2", text: "Đường Hòa Minh 2" },
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường Lê Duẩn", text: "Đường Lê Duẩn" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Hồ Quý Ly", text: "Đường Hồ Quý Ly" },
              { value: "Đường Kỳ Đồng", text: "Đường Kỳ Đồng" },
            ],
          },
          {
            value: "Phường Hòa Khê",
            text: "Phường Hòa Khê",
            streets: [
              { value: "Đường Lê Hữu Trác", text: "Đường Lê Hữu Trác" },
              { value: "Đường Hoàng Văn Thái", text: "Đường Hoàng Văn Thái" },
              { value: "Đường Tôn Đức Thắng", text: "Đường Tôn Đức Thắng" },
              { value: "Đường Hà Huy Tập", text: "Đường Hà Huy Tập" },
              { value: "Đường Nguyễn Thái Học", text: "Đường Nguyễn Thái Học" },
              {
                value: "Đường Cách Mạng Tháng Tám",
                text: "Đường Cách Mạng Tháng Tám",
              },
              { value: "Đường Lý Tự Trọng", text: "Đường Lý Tự Trọng" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
            ],
          },
          {
            value: "Phường Hòa Xuân",
            text: "Phường Hòa Xuân",
            streets: [
              { value: "Đường Kỳ Hà", text: "Đường Kỳ Hà" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Đặng Văn Ngữ", text: "Đường Đặng Văn Ngữ" },
              { value: "Đường Hòa Xuân", text: "Đường Hòa Xuân" },
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường Lê Tấn Trung", text: "Đường Lê Tấn Trung" },
              {
                value: "Đường Nguyễn Kim Quang",
                text: "Đường Nguyễn Kim Quang",
              },
            ],
          },
          {
            value: "Phường Hòa Minh",
            text: "Phường Hòa Minh",
            streets: [
              { value: "Đường Lê Hữu Trác", text: "Đường Lê Hữu Trác" },
              { value: "Đường Hoàng Văn Thái", text: "Đường Hoàng Văn Thái" },
              { value: "Đường Tôn Đức Thắng", text: "Đường Tôn Đức Thắng" },
              { value: "Đường Hà Huy Tập", text: "Đường Hà Huy Tập" },
              { value: "Đường Nguyễn Thái Học", text: "Đường Nguyễn Thái Học" },
              {
                value: "Đường Cách Mạng Tháng Tám",
                text: "Đường Cách Mạng Tháng Tám",
              },
              { value: "Đường Lý Tự Trọng", text: "Đường Lý Tự Trọng" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
            ],
          },
          {
            value: "Phường Hòa Tình",
            text: "Phường Hòa Tình",
            streets: [
              { value: "Đường 18", text: "Đường 18" },
              { value: "Đường Tống Tôn Thống", text: "Đường Tống Tôn Thống" },
              { value: "Đường Điện Biên Phủ", text: "Đường Điện Biên Phủ" },
              { value: "Đường Hưng Thịnh", text: "Đường Hưng Thịnh" },
              { value: "Đường Nguyễn Sơn", text: "Đường Nguyễn Sơn" },
              { value: "Đường Tân Sơn", text: "Đường Tân Sơn" },
              { value: "Đường Hòa Lộc", text: "Đường Hòa Lộc" },
              { value: "Đường Bắc Tổ", text: "Đường Bắc Tổ" },
            ],
          },
          {
            value: "Phường Liên Đại",
            text: "Phường Liên Đại",
            streets: [
              { value: "Đường Lê Thị Liên", text: "Đường Lê Thị Liên" },
              { value: "Đường Cửa Liên", text: "Đường Cửa Liên" },
              { value: "Đường Hàng Sải", text: "Đường Hàng Sải" },
              { value: "Đường Nguyên Lục", text: "Đường Nguyên Lục" },
              { value: "Đường Hợp Thạch", text: "Đường Hợp Thạch" },
              { value: "Đường Đình Lên", text: "Đường Đình Lên" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Bắc Sơn", text: "Đường Bắc Sơn" },
            ],
          },
          {
            value: "Phường Trần Do",
            text: "Phường Trần Do",
            streets: [
              { value: "Đường Nhân Chế", text: "Đường Nhân Chế" },
              { value: "Đường Trúc Kỳ", text: "Đường Trúc Kỳ" },
              { value: "Đường Bình Khả", text: "Đường Bình Khả" },
              { value: "Đường Cầu Cảng", text: "Đường Cầu Cảng" },
              { value: "Đường Nguyễn Linh", text: "Đường Nguyễn Linh" },
              { value: "Đường Thôn Làng", text: "Đường Thôn Làng" },
              { value: "Đường Quán Thành", text: "Đường Quán Thành" },
              { value: "Đường Lăng Vũng", text: "Đường Lăng Vũng" },
            ],
          },
          {
            value: "Phường Phong Do",
            text: "Phường Phong Do",
            streets: [
              { value: "Đường Đường 18", text: "Đường Đường 18" },
              { value: "Đường Lúa Tế", text: "Đường Lúa Tế" },
              { value: "Đường Dựng", text: "Đường Dựng" },
              { value: "Đường Quảng Tạo", text: "Đường Quảng Tạo" },
              { value: "Đường Nơi Nhắm", text: "Đường Nơi Nhắm" },
              { value: "Đường Thiềm Thạch", text: "Đường Thiềm Thạch" },
              { value: "Đường Phước Lộc", text: "Đường Phước Lộc" },
              { value: "Đường Bắc Đường", text: "Đường Bắc Đường" },
            ],
          },
        ],
      },
      {
        value: "Ngũ Hành Sơn",
        text: "Ngũ Hành Sơn",
        wards: [
          {
            value: "Hoa Hai",
            text: "Phường Hòa Hải",
            streets: [
              { value: "Đường Hoàng Kế Viêm", text: "Đường Hoàng Kế Viêm" },
              { value: "Đường Lê Văn Duyệt", text: "Đường Lê Văn Duyệt" },
              { value: "Đường Hòa Hải 2", text: "Đường Hòa Hải 2" },
              { value: "Đường An Thượng 2", text: "Đường An Thượng 2" },
              { value: "Đường Hoàng Văn Thái", text: "Đường Hoàng Văn Thái" },
              { value: "Đường Mỹ An", text: "Đường Mỹ An" },
              { value: "Đường Khuê Mỹ", text: "Đường Khuê Mỹ" },
              {
                value: "Đường Nguyễn Bỉnh Khiêm",
                text: "Đường Nguyễn Bỉnh Khiêm",
              },
            ],
          },
          {
            value: "Phường Hòa Quý",
            text: "Phường Hòa Quý",
            streets: [
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường Hòa Quý", text: "Đường Hòa Quý" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Châu Thị Kim", text: "Đường Châu Thị Kim" },
              { value: "Đường Nguyễn Sơn", text: "Đường Nguyễn Sơn" },
              { value: "Đường Lê Quang Đạo", text: "Đường Lê Quang Đạo" },
              { value: "Đường Võ Nguyên Giáp", text: "Đường Võ Nguyên Giáp" },
              { value: "Đường Đống Đa", text: "Đường Đống Đa" },
            ],
          },
          {
            value: "Phường Hòa Bắc",
            text: "Phường Hòa Bắc",
            streets: [
              { value: "Đường Cầu Đỏ", text: "Đường Cầu Đỏ" },
              { value: "Đường Đà Nẵng", text: "Đường Đà Nẵng" },
              { value: "Đường Tân Thái", text: "Đường Tân Thái" },
              { value: "Đường Đô Lương", text: "Đường Đô Lương" },
              { value: "Đường Tân Hội", text: "Đường Tân Hội" },
              { value: "Đường Châu Thị Đảo", text: "Đường Châu Thị Đảo" },
              { value: "Đường Như Xuân", text: "Đường Như Xuân" },
              { value: "Đường Duy Tân", text: "Đường Duy Tân" },
            ],
          },
          {
            value: "Phường Hòa Vang",
            text: "Phường Hòa Vang",
            streets: [
              {
                value: "Đường Nguyễn Thái Bình",
                text: "Đường Nguyễn Thái Bình",
              },
              { value: "Đường Đèo Cả", text: "Đường Đèo Cả" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Đà Lạt", text: "Đường Đà Lạt" },
              { value: "Đường Lê Đức Thọ", text: "Đường Lê Đức Thọ" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Phan Đăng Lưu", text: "Đường Phan Đăng Lưu" },
              { value: "Đường Phạm Ngọc Thạch", text: "Đường Phạm Ngọc Thạch" },
            ],
          },
          {
            value: "Phường Hòa Sơn",
            text: "Phường Hòa Sơn",
            streets: [
              { value: "Đường An Sơn", text: "Đường An Sơn" },
              { value: "Đường Sơn Tịnh", text: "Đường Sơn Tịnh" },
              { value: "Đường Sơn Mỹ", text: "Đường Sơn Mỹ" },
              { value: "Đường Sơn Kim", text: "Đường Sơn Kim" },
              { value: "Đường Tường Quảng", text: "Đường Tường Quảng" },
              { value: "Đường Đồng Ngọc", text: "Đường Đồng Ngọc" },
              { value: "Đường Hà Văn Tới", text: "Đường Hà Văn Tới" },
              { value: "Đường Cửu Long", text: "Đường Cửu Long" },
            ],
          },
          {
            value: "Phường Hòa Linh",
            text: "Phường Hòa Linh",
            streets: [
              { value: "Đường Minh Thành", text: "Đường Minh Thành" },
              { value: "Đường Đoàn Trường", text: "Đường Đoàn Trường" },
              { value: "Đường Hòa Linh", text: "Đường Hòa Linh" },
              { value: "Đường Dương Kế Liêm", text: "Đường Dương Kế Liêm" },
              { value: "Đường Hà Tiến", text: "Đường Hà Tiến" },
              { value: "Đường Tiên Lữ", text: "Đường Tiên Lữ" },
              { value: "Đường Đông Xuân", text: "Đường Đông Xuân" },
              { value: "Đường Vạn Phúc", text: "Đường Vạn Phúc" },
            ],
          },
          {
            value: "Phường Hòa Thanh",
            text: "Phường Hòa Thanh",
            streets: [
              { value: "Đường Từ Sơn", text: "Đường Từ Sơn" },
              { value: "Đường Hòa Thanh 2", text: "Đường Hòa Thanh 2" },
              { value: "Đường Đặng Dũng", text: "Đường Đặng Dũng" },
              { value: "Đường Thành Phát", text: "Đường Thành Phát" },
              { value: "Đường Long An", text: "Đường Long An" },
              { value: "Đường Cây Bài", text: "Đường Cây Bài" },
              { value: "Đường Trần Thái Tông", text: "Đường Trần Thái Tông" },
              { value: "Đường Lý Phúc", text: "Đường Lý Phúc" },
            ],
          },
          {
            value: "Phường Hòa Dương",
            text: "Phường Hòa Dương",
            streets: [
              { value: "Đường Quang Minh", text: "Đường Quang Minh" },
              { value: "Đường Đội Cấn", text: "Đường Đội Cấn" },
              { value: "Đường Phú Tảo", text: "Đường Phú Tảo" },
              { value: "Đường Hà Trực", text: "Đường Hà Trực" },
              { value: "Đường Đoàn Thị Điểm", text: "Đường Đoàn Thị Điểm" },
              { value: "Đường Thiện Trường", text: "Đường Thiện Trường" },
              { value: "Đường Quảng Tố", text: "Đường Quảng Tố" },
              { value: "Đường Tống Nhân", text: "Đường Tống Nhân" },
            ],
          },
        ],
      },
      {
        value: "Sơn Trà",
        text: "Sơn Trà",
        wards: [
          {
            value: "Phường An Hải Bắc",
            text: "Phường An Hải Bắc",
            streets: [
              { value: "Đường An Hải Bắc", text: "Đường An Hải Bắc" },
              { value: "Đường Lê Quang Đạo", text: "Đường Lê Quang Đạo" },
              { value: "Đường Võ Nguyên Giáp", text: "Đường Võ Nguyên Giáp" },
              { value: "Đường Mỹ An", text: "Đường Mỹ An" },
              { value: "Đường Đỗ Quang", text: "Đường Đỗ Quang" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Sơn Trà", text: "Đường Sơn Trà" },
              { value: "Đường Duy Tân", text: "Đường Duy Tân" },
            ],
          },
          {
            value: "Phường An Hải Đông",
            text: "Phường An Hải Đông",
            streets: [
              { value: "Đường An Hải Đông", text: "Đường An Hải Đông" },
              { value: "Đường Tô Hiệu", text: "Đường Tô Hiệu" },
              { value: "Đường Bạch Đằng", text: "Đường Bạch Đằng" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Hoàng Sa", text: "Đường Hoàng Sa" },
              { value: "Đường Phan Tứ", text: "Đường Phan Tứ" },
              { value: "Đường Hoàng Kế Viêm", text: "Đường Hoàng Kế Viêm" },
              { value: "Đường Lý Thường Kiệt", text: "Đường Lý Thường Kiệt" },
            ],
          },
          {
            value: "Phường Phước Mỹ",
            text: "Phường Phước Mỹ",
            streets: [
              { value: "Đường Phước Mỹ", text: "Đường Phước Mỹ" },
              { value: "Đường Lê Văn Duyệt", text: "Đường Lê Văn Duyệt" },
              { value: "Đường Đống Đa", text: "Đường Đống Đa" },
              { value: "Đường Bùi Viện", text: "Đường Bùi Viện" },
              { value: "Đường Trường Sa", text: "Đường Trường Sa" },
              { value: "Đường Hoàng Đạo Thúy", text: "Đường Hoàng Đạo Thúy" },
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường An Hải Bắc", text: "Đường An Hải Bắc" },
            ],
          },
          {
            value: "Phường Mân Thái",
            text: "Phường Mân Thái",
            streets: [
              { value: "Đường Mân Thái", text: "Đường Mân Thái" },
              { value: "Đường Dương Đình Nghệ", text: "Đường Dương Đình Nghệ" },
              { value: "Đường Tôn Đức Thắng", text: "Đường Tôn Đức Thắng" },
              {
                value: "Đường Nguyễn Bỉnh Khiêm",
                text: "Đường Nguyễn Bỉnh Khiêm",
              },
              { value: "Đường Hòa Bình", text: "Đường Hòa Bình" },
              { value: "Đường Ngô Quyền", text: "Đường Ngô Quyền" },
              { value: "Đường Châu Thị Kim", text: "Đường Châu Thị Kim" },
              { value: "Đường Lê Đức Thọ", text: "Đường Lê Đức Thọ" },
            ],
          },
          {
            value: "Phường Thọ Quang",
            text: "Phường Thọ Quang",
            streets: [
              { value: "Đường Thọ Quang", text: "Đường Thọ Quang" },
              { value: "Đường Hoàng Văn Thái", text: "Đường Hoàng Văn Thái" },
              { value: "Đường Trung Nghĩa", text: "Đường Trung Nghĩa" },
              { value: "Đường An Đồn", text: "Đường An Đồn" },
              { value: "Đường Lê Đức Thọ", text: "Đường Lê Đức Thọ" },
              {
                value: "Đường Nguyễn Trung Trực",
                text: "Đường Nguyễn Trung Trực",
              },
              { value: "Đường Nguyễn Công Trứ", text: "Đường Nguyễn Công Trứ" },
              { value: "Đường Ngô Gia Tự", text: "Đường Ngô Gia Tự" },
            ],
          },
          {
            value: "Phường Sơn Trà",
            text: "Phường Sơn Trà",
            streets: [
              { value: "Đường Sơn Trà", text: "Đường Sơn Trà" },
              { value: "Đường Hoàng Sa", text: "Đường Hoàng Sa" },
              { value: "Đường Châu Thị Kim", text: "Đường Châu Thị Kim" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Trường Sa", text: "Đường Trường Sa" },
              { value: "Đường Hồ Nghinh", text: "Đường Hồ Nghinh" },
              {
                value: "Đường Đoàn Trọng Trinh",
                text: "Đường Đoàn Trọng Trinh",
              },
              { value: "Đường Quang Trung", text: "Đường Quang Trung" },
            ],
          },
          {
            value: "Phường Xuân Hà",
            text: "Phường Xuân Hà",
            streets: [
              { value: "Đường Xuân Hà", text: "Đường Xuân Hà" },
              { value: "Đường Hòa Khê", text: "Đường Hòa Khê" },
              { value: "Đường Hàm Nghi", text: "Đường Hàm Nghi" },
              {
                value: "Đường Nguyễn Đình Chiểu",
                text: "Đường Nguyễn Đình Chiểu",
              },
              { value: "Đường Điện Biên Phủ", text: "Đường Điện Biên Phủ" },
              { value: "Đường Lê Văn Hưu", text: "Đường Lê Văn Hưu" },
              { value: "Đường An Đồn", text: "Đường An Đồn" },
              { value: "Đường Trần Cao Vân", text: "Đường Trần Cao Vân" },
            ],
          },
          {
            value: "Thanh Khê",
            text: "Thanh Khê",
            streets: [
              { value: "Đường Thanh Khê", text: "Đường Thanh Khê" },
              { value: "Đường Trần Cao Vân", text: "Đường Trần Cao Vân" },
              { value: "Đường Châu Thị Kim", text: "Đường Châu Thị Kim" },
              { value: "Đường Hà Bổng", text: "Đường Hà Bổng" },
              { value: "Đường Lê Đức Thọ", text: "Đường Lê Đức Thọ" },
              {
                value: "Đường Nguyễn Trung Trực",
                text: "Đường Nguyễn Trung Trực",
              },
              { value: "Đường Nguyễn Sinh Sắc", text: "Đường Nguyễn Sinh Sắc" },
              { value: "Đường Duy Tân", text: "Đường Duy Tân" },
            ],
          },
        ],
      },
    ],
    BinhDuong: [
      {
        value: "Dĩ An",
        text: "Dĩ An",
        wards: [
          {
            value: "Phường Dĩ An",
            text: "Phường Dĩ An",
            streets: [
              { value: "Đường Dĩ An", text: "Đường Dĩ An" },
              { value: "Đường Nguyễn An Ninh", text: "Đường Nguyễn An Ninh" },
              { value: "Đường Thống Nhất", text: "Đường Thống Nhất" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Độc Lập", text: "Đường Độc Lập" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
            ],
          },
          {
            value: "Phường Tân Long",
            text: "Phường Tân Long",
            streets: [
              { value: "Đường Tân Long", text: "Đường Tân Long" },
              { value: "Đường Lê Quang Đạo", text: "Đường Lê Quang Đạo" },
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường Thống Nhất", text: "Đường Thống Nhất" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường Độc Lập", text: "Đường Độc Lập" },
              { value: "Đường Đoàn Văn Tiến", text: "Đường Đoàn Văn Tiến" },
            ],
          },
          {
            value: "Phường Tân Bình",
            text: "Phường Tân Bình",
            streets: [
              { value: "Đường Tân Bình", text: "Đường Tân Bình" },
              {
                value: "Đường Nguyễn Đình Chiểu",
                text: "Đường Nguyễn Đình Chiểu",
              },
              { value: "Đường Thống Nhất", text: "Đường Thống Nhất" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường Nguyễn An Ninh", text: "Đường Nguyễn An Ninh" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
            ],
          },
          {
            value: "Phường Tân An",
            text: "Phường Tân An",
            streets: [
              { value: "Đường Tân An", text: "Đường Tân An" },
              {
                value: "Đường Nguyễn Tri Phương",
                text: "Đường Nguyễn Tri Phương",
              },
              { value: "Đường Độc Lập", text: "Đường Độc Lập" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
              { value: "Đường Nguyễn An Ninh", text: "Đường Nguyễn An Ninh" },
            ],
          },
          {
            value: "Phường Việt Hưng",
            text: "Phường Việt Hưng",
            streets: [
              { value: "Đường Việt Hưng", text: "Đường Việt Hưng" },
              { value: "Đường Lê Quang Đạo", text: "Đường Lê Quang Đạo" },
              { value: "Đường Nguyễn Văn Cừ", text: "Đường Nguyễn Văn Cừ" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Tôn Đức Thắng", text: "Đường Tôn Đức Thắng" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
            ],
          },
          {
            value: "Phường Tân Dinh",
            text: "Phường Tân Dinh",
            streets: [
              { value: "Đường Tân Dinh", text: "Đường Tân Dinh" },
              {
                value: "Đường Nguyễn Tri Phương",
                text: "Đường Nguyễn Tri Phương",
              },
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường Dĩ An", text: "Đường Dĩ An" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường Nguyễn An Ninh", text: "Đường Nguyễn An Ninh" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Đoàn Văn Tiến", text: "Đường Đoàn Văn Tiến" },
            ],
          },
          {
            value: "Phường Tân Nhật",
            text: "Phường Tân Nhật",
            streets: [
              { value: "Đường Tân Nhật", text: "Đường Tân Nhật" },
              {
                value: "Đường Nguyễn Đình Chiểu",
                text: "Đường Nguyễn Đình Chiểu",
              },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Tôn Đức Thắng", text: "Đường Tôn Đức Thắng" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường Lê Duẩn", text: "Đường Lê Duẩn" },
              { value: "Đường Trường Sa", text: "Đường Trường Sa" },
            ],
          },
          {
            value: "Phường Long Sơn",
            text: "Phường Long Sơn",
            streets: [
              { value: "Đường Long Sơn", text: "Đường Long Sơn" },
              { value: "Đường Duy Tân", text: "Đường Duy Tân" },
              {
                value: "Đường Nguyễn Trung Trực",
                text: "Đường Nguyễn Trung Trực",
              },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường Nguyễn Bính", text: "Đường Nguyễn Bính" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
              { value: "Đường Đoàn Thị Điểm", text: "Đường Đoàn Thị Điểm" },
            ],
          },
        ],
      },
      {
        value: "Bến Cát",
        text: "Bến Cát",
        wards: [
          {
            value: "Phường Tân Đông Hiệp",
            text: "Phường Tân Đông Hiệp",
            streets: [
              { value: "Đường DT743", text: "Đường DT743" },
              { value: "Đường Tân Đông Hiệp", text: "Đường Tân Đông Hiệp" },
              { value: "Đường Mỹ Phước", text: "Đường Mỹ Phước" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường Quốc Lộ 13", text: "Đường Quốc Lộ 13" },
              { value: "Đường ĐT750", text: "Đường ĐT750" },
              { value: "Đường Độc Lập", text: "Đường Độc Lập" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
            ],
          },
          {
            value: "Phường Tân Đại",
            text: "Phường Tân Đại",
            streets: [
              { value: "Đường Tân Đại", text: "Đường Tân Đại" },
              { value: "Đường Tân Thạnh", text: "Đường Tân Thạnh" },
              { value: "Đường DT743", text: "Đường DT743" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường Mỹ Phước", text: "Đường Mỹ Phước" },
              { value: "Đường Cây Xoài", text: "Đường Cây Xoài" },
              { value: "Đường 30/4", text: "Đường 30/4" },
            ],
          },
          {
            value: "Phường Tân Uyên",
            text: "Phường Tân Uyên",
            streets: [
              { value: "Đường Tân Uyên", text: "Đường Tân Uyên" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường ĐT750", text: "Đường ĐT750" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
            ],
          },
          {
            value: "Phường Thạnh Tân",
            text: "Phường Thạnh Tân",
            streets: [
              { value: "Đường Thạnh Tân", text: "Đường Thạnh Tân" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường DT743", text: "Đường DT743" },
              { value: "Đường Quốc Lộ 13", text: "Đường Quốc Lộ 13" },
              { value: "Đường Mỹ Phước", text: "Đường Mỹ Phước" },
              { value: "Đường Tân Đông Hiệp", text: "Đường Tân Đông Hiệp" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
            ],
          },
          {
            value: "Phường Tân Phong",
            text: "Phường Tân Phong",
            streets: [
              { value: "Đường Tân Phong", text: "Đường Tân Phong" },
              { value: "Đường Mỹ Phước", text: "Đường Mỹ Phước" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường Tân Uyên", text: "Đường Tân Uyên" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường ĐT750", text: "Đường ĐT750" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
              { value: "Đường Tân Thạnh", text: "Đường Tân Thạnh" },
            ],
          },
          {
            value: "Phường Bến Cát",
            text: "Phường Bến Cát",
            streets: [
              { value: "Đường Bến Cát", text: "Đường Bến Cát" },
              { value: "Đường Tân Đông Hiệp", text: "Đường Tân Đông Hiệp" },
              { value: "Đường Quốc Lộ 13", text: "Đường Quốc Lộ 13" },
              { value: "Đường DT743", text: "Đường DT743" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
            ],
          },
          {
            value: "Phường Tân Tân",
            text: "Phường Tân Tân",
            streets: [
              { value: "Đường Tân Tân", text: "Đường Tân Tân" },
              { value: "Đường Tân Thạnh", text: "Đường Tân Thạnh" },
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường Độc Lập", text: "Đường Độc Lập" },
              { value: "Đường Đoàn Văn Tiến", text: "Đường Đoàn Văn Tiến" },
            ],
          },
          {
            value: "Phường Phước Vĩnh",
            text: "Phường Phước Vĩnh",
            streets: [
              { value: "Đường Phước Vĩnh", text: "Đường Phước Vĩnh" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường Tân Uyên", text: "Đường Tân Uyên" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường ĐT750", text: "Đường ĐT750" },
              { value: "Đường Quốc Lộ 13", text: "Đường Quốc Lộ 13" },
              { value: "Đường 30/4", text: "Đường 30/4" },
            ],
          },
        ],
      },
      {
        value: "Bắc Tân Uyên",
        text: "Bắc Tân Uyên",
        wards: [
          {
            value: "Phường Tân Hiệu",
            text: "Phường Tân Hiệu",
            streets: [
              { value: "Đường Tân Hiệu", text: "Đường Tân Hiệu" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Tân Uyên", text: "Đường Tân Uyên" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
            ],
          },
          {
            value: "Phường Tân Phú",
            text: "Phường Tân Phú",
            streets: [
              { value: "Đường Tân Phú", text: "Đường Tân Phú" },
              { value: "Đường ĐT750", text: "Đường ĐT750" },
              { value: "Đường Quốc Lộ 13", text: "Đường Quốc Lộ 13" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
            ],
          },
          {
            value: "Phường Tân Tây",
            text: "Phường Tân Tây",
            streets: [
              { value: "Đường Tân Tây", text: "Đường Tân Tây" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
            ],
          },
          {
            value: "Phường Tân Tài",
            text: "Phường Tân Tài",
            streets: [
              { value: "Đường Tân Tài", text: "Đường Tân Tài" },
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường Quốc Lộ 13", text: "Đường Quốc Lộ 13" },
              { value: "Đường ĐT750", text: "Đường ĐT750" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
            ],
          },
          {
            value: "Phường Tân Tạo",
            text: "Phường Tân Tạo",
            streets: [
              { value: "Đường Tân Tạo", text: "Đường Tân Tạo" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
              { value: "Đường Tân Uyên", text: "Đường Tân Uyên" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
            ],
          },
        ],
      },
      {
        value: "Thủ Dầu Một",
        text: "Thủ Dầu Một",
        wards: [
          {
            value: "Phường Phú Hòa",
            text: "Phường Phú Hòa",
            streets: [
              { value: "Đường Phú Hòa", text: "Đường Phú Hòa" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Lê Hồng Phong", text: "Đường Lê Hồng Phong" },
              { value: "Đường Hoàng Hoa Thám", text: "Đường Hoàng Hoa Thám" },
              { value: "Đường Đoàn Thị Điểm", text: "Đường Đoàn Thị Điểm" },
            ],
          },
          {
            value: "Phường Hiệp Thành",
            text: "Phường Hiệp Thành",
            streets: [
              { value: "Đường Hiệp Thành", text: "Đường Hiệp Thành" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
              { value: "Đường Phú Lợi", text: "Đường Phú Lợi" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường 30/4", text: "Đường 30/4" },
            ],
          },
          {
            value: "Phường Tân An",
            text: "Phường Tân An",
            streets: [
              { value: "Đường Tân An", text: "Đường Tân An" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Nguyễn An Ninh", text: "Đường Nguyễn An Ninh" },
              { value: "Đường Phú Lợi", text: "Đường Phú Lợi" },
              { value: "Đường 30/4", text: "Đường 30/4" },
            ],
          },
          {
            value: "Phường Chánh Mỹ",
            text: "Phường Chánh Mỹ",
            streets: [
              { value: "Đường Chánh Mỹ", text: "Đường Chánh Mỹ" },
              { value: "Đường Phú Lợi", text: "Đường Phú Lợi" },
              { value: "Đường Nguyễn Huệ", text: "Đường Nguyễn Huệ" },
              { value: "Đường Hoàng Hoa Thám", text: "Đường Hoàng Hoa Thám" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Lê Hồng Phong", text: "Đường Lê Hồng Phong" },
            ],
          },
          {
            value: "Phường Phú Mỹ",
            text: "Phường Phú Mỹ",
            streets: [
              { value: "Đường Phú Mỹ", text: "Đường Phú Mỹ" },
              { value: "Đường Nguyễn Văn Cừ", text: "Đường Nguyễn Văn Cừ" },
              { value: "Đường Quốc Lộ 13", text: "Đường Quốc Lộ 13" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
            ],
          },
        ],
      },
      {
        value: "Bàu Bàng",
        text: "Bàu Bàng",
        wards: [
          {
            value: "Xã Bàu Bàng",
            text: "Xã Bàu Bàng",
            streets: [
              { value: "Đường Bàu Bàng", text: "Đường Bàu Bàng" },
              { value: "Đường ĐT741", text: "Đường ĐT741" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Thới Hòa", text: "Đường Thới Hòa" },
              { value: "Đường 27/3", text: "Đường 27/3" },
              {
                value: "Đường Mỹ Phước Tân Vạn",
                text: "Đường Mỹ Phước Tân Vạn",
              },
            ],
          },
          {
            value: "Xã Hòa Lạc",
            text: "Xã Hòa Lạc",
            streets: [
              { value: "Đường Hòa Lạc", text: "Đường Hòa Lạc" },
              { value: "Đường Thới Hòa", text: "Đường Thới Hòa" },
              { value: "Đường ĐT741", text: "Đường ĐT741" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường ĐT743", text: "Đường ĐT743" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
            ],
          },
          {
            value: "Xã Tân Bình",
            text: "Xã Tân Bình",
            streets: [
              { value: "Đường Tân Bình", text: "Đường Tân Bình" },
              { value: "Đường ĐT741", text: "Đường ĐT741" },
              { value: "Đường 27/3", text: "Đường 27/3" },
              {
                value: "Đường Mỹ Phước Tân Vạn",
                text: "Đường Mỹ Phước Tân Vạn",
              },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường 30/4", text: "Đường 30/4" },
            ],
          },
          {
            value: "Xã Lập An",
            text: "Xã Lập An",
            streets: [
              { value: "Đường Lập An", text: "Đường Lập An" },
              { value: "Đường ĐT741", text: "Đường ĐT741" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Thới Hòa", text: "Đường Thới Hòa" },
              { value: "Đường Mỹ Phước", text: "Đường Mỹ Phước" },
              { value: "Đường 27/3", text: "Đường 27/3" },
            ],
          },
          {
            value: "Xã Long Hiếu",
            text: "Xã Long Hiếu",
            streets: [
              { value: "Đường Long Hiếu", text: "Đường Long Hiếu" },
              { value: "Đường ĐT741", text: "Đường ĐT741" },
              {
                value: "Đường Mỹ Phước Tân Vạn",
                text: "Đường Mỹ Phước Tân Vạn",
              },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Thới Hòa", text: "Đường Thới Hòa" },
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
            ],
          },
        ],
      },
      {
        value: "Dầu Tiếng",
        text: "Dầu Tiếng",
        wards: [
          {
            value: "Thị trấn Dầu Tiếng",
            text: "Thị trấn Dầu Tiếng",
            streets: [
              { value: "Đường Dầu Tiếng", text: "Đường Dầu Tiếng" },
              { value: "Đường Thống Nhất", text: "Đường Thống Nhất" },
              { value: "Đường Tân Hiệp", text: "Đường Tân Hiệp" },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường ĐT744", text: "Đường ĐT744" },
              { value: "Đường Long Hòa", text: "Đường Long Hòa" },
            ],
          },
          {
            value: "Xã Đại Lâm",
            text: "Xã Đại Lâm",
            streets: [
              { value: "Đường Đại Lâm", text: "Đường Đại Lâm" },
              { value: "Đường ĐT744", text: "Đường ĐT744" },
              { value: "Đường Long Hòa", text: "Đường Long Hòa" },
              { value: "Đường Tân Hiệp", text: "Đường Tân Hiệp" },
              { value: "Đường Thống Nhất", text: "Đường Thống Nhất" },
              { value: "Đường Tân Hưng", text: "Đường Tân Hưng" },
            ],
          },
          {
            value: "Xã Thanh An",
            text: "Xã Thanh An",
            streets: [
              { value: "Đường Thanh An", text: "Đường Thanh An" },
              { value: "Đường ĐT744", text: "Đường ĐT744" },
              { value: "Đường Tân Hiệp", text: "Đường Tân Hiệp" },
              { value: "Đường Long Hòa", text: "Đường Long Hòa" },
              { value: "Đường Thống Nhất", text: "Đường Thống Nhất" },
              { value: "Đường Tân Hưng", text: "Đường Tân Hưng" },
            ],
          },
          {
            value: "Xã Tân Uyên",
            text: "Xã Tân Uyên",
            streets: [
              { value: "Đường Tân Uyên", text: "Đường Tân Uyên" },
              { value: "Đường ĐT744", text: "Đường ĐT744" },
              { value: "Đường Long Hòa", text: "Đường Long Hòa" },
              { value: "Đường Tân Hiệp", text: "Đường Tân Hiệp" },
              { value: "Đường Thống Nhất", text: "Đường Thống Nhất" },
              { value: "Đường Tân Hưng", text: "Đường Tân Hưng" },
            ],
          },
          {
            value: "Xã Thanh Tân",
            text: "Xã Thanh Tân",
            streets: [
              { value: "Đường Thanh Tân", text: "Đường Thanh Tân" },
              { value: "Đường ĐT744", text: "Đường ĐT744" },
              { value: "Đường Long Hòa", text: "Đường Long Hòa" },
              { value: "Đường Tân Hiệp", text: "Đường Tân Hiệp" },
              { value: "Đường Thống Nhất", text: "Đường Thống Nhất" },
              { value: "Đường Tân Hưng", text: "Đường Tân Hưng" },
            ],
          },
        ],
      },
      {
        value: "Phú Giáo",
        text: "Phú Giáo",
        wards: [
          {
            value: "Thị trấn Phú Giáo",
            text: "Thị trấn Phú Giáo",
            streets: [
              { value: "Đường Phú Giáo", text: "Đường Phú Giáo" },
              { value: "Đường Thống Nhất", text: "Đường Thống Nhất" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường ĐT744", text: "Đường ĐT744" },
              { value: "Đường Hòa Bình", text: "Đường Hòa Bình" },
              { value: "Đường Long Hòa", text: "Đường Long Hòa" },
            ],
          },
          {
            value: "Xã Tam Lập",
            text: "Xã Tam Lập",
            streets: [
              { value: "Đường Tam Lập", text: "Đường Tam Lập" },
              { value: "Đường ĐT744", text: "Đường ĐT744" },
              { value: "Đường Long Hòa", text: "Đường Long Hòa" },
              { value: "Đường Bình Minh", text: "Đường Bình Minh" },
              { value: "Đường Tân Hòa", text: "Đường Tân Hòa" },
              { value: "Đường Hòa Bình", text: "Đường Hòa Bình" },
            ],
          },
          {
            value: "Xã Phước Vĩnh",
            text: "Xã Phước Vĩnh",
            streets: [
              { value: "Đường Phước Vĩnh", text: "Đường Phước Vĩnh" },
              { value: "Đường Tân Bình", text: "Đường Tân Bình" },
              { value: "Đường ĐT744", text: "Đường ĐT744" },
              { value: "Đường Long Hòa", text: "Đường Long Hòa" },
              { value: "Đường Bình Minh", text: "Đường Bình Minh" },
              { value: "Đường Tân Hiệp", text: "Đường Tân Hiệp" },
            ],
          },
          {
            value: "Xã Tam Sơn",
            text: "Xã Tam Sơn",
            streets: [
              { value: "Đường Tam Sơn", text: "Đường Tam Sơn" },
              { value: "Đường ĐT744", text: "Đường ĐT744" },
              { value: "Đường Bình Minh", text: "Đường Bình Minh" },
              { value: "Đường Long Hòa", text: "Đường Long Hòa" },
              { value: "Đường Tân Hòa", text: "Đường Tân Hòa" },
              { value: "Đường Hòa Bình", text: "Đường Hòa Bình" },
            ],
          },
          {
            value: "Xã Tây Sơn",
            text: "Xã Tây Sơn",
            streets: [
              { value: "Đường Tây Sơn", text: "Đường Tây Sơn" },
              { value: "Đường ĐT744", text: "Đường ĐT744" },
              { value: "Đường Bình Minh", text: "Đường Bình Minh" },
              { value: "Đường Long Hòa", text: "Đường Long Hòa" },
              { value: "Đường Tân Hòa", text: "Đường Tân Hòa" },
              { value: "Đường Hòa Bình", text: "Đường Hòa Bình" },
            ],
          },
        ],
      },
      {
        value: "Tân Uyên",
        text: "Tân Uyên",
        wards: [
          {
            value: "Phường Lạc An",
            text: "Phường Lạc An",
            streets: [
              { value: "Đường Lạc An", text: "Đường Lạc An" },
              { value: "Đường ĐT746", text: "Đường ĐT746" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Thống Nhất", text: "Đường Thống Nhất" },
              { value: "Đường ĐT742", text: "Đường ĐT742" },
              { value: "Đường Tân An", text: "Đường Tân An" },
            ],
          },
          {
            value: "Phường Tân An",
            text: "Phường Tân An",
            streets: [
              { value: "Đường Tân An", text: "Đường Tân An" },
              { value: "Đường ĐT746", text: "Đường ĐT746" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Thống Nhất", text: "Đường Thống Nhất" },
              { value: "Đường Tân Uyên", text: "Đường Tân Uyên" },
              { value: "Đường Lê Duẩn", text: "Đường Lê Duẩn" },
            ],
          },
          {
            value: "Phường Bình Dương",
            text: "Phường Bình Dương",
            streets: [
              { value: "Đường Bình Dương", text: "Đường Bình Dương" },
              { value: "Đường ĐT746", text: "Đường ĐT746" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Thống Nhất", text: "Đường Thống Nhất" },
              { value: "Đường Tân An", text: "Đường Tân An" },
              { value: "Đường Lê Duẩn", text: "Đường Lê Duẩn" },
            ],
          },
          {
            value: "Phường Đông Hòa",
            text: "Phường Đông Hòa",
            streets: [
              { value: "Đường Đông Hòa", text: "Đường Đông Hòa" },
              { value: "Đường ĐT746", text: "Đường ĐT746" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Thống Nhất", text: "Đường Thống Nhất" },
              { value: "Đường ĐT742", text: "Đường ĐT742" },
              { value: "Đường Tân Hòa", text: "Đường Tân Hòa" },
            ],
          },
          {
            value: "Phường Bắc Tân Uyên",
            text: "Phường Bắc Tân Uyên",
            streets: [
              { value: "Đường Bắc Tân Uyên", text: "Đường Bắc Tân Uyên" },
              { value: "Đường ĐT746", text: "Đường ĐT746" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Thống Nhất", text: "Đường Thống Nhất" },
              { value: "Đường Tân An", text: "Đường Tân An" },
              { value: "Đường Lê Duẩn", text: "Đường Lê Duẩn" },
            ],
          },
          {
            value: "Phường Tân Hiệp",
            text: "Phường Tân Hiệp",
            streets: [
              { value: "Đường Tân Hiệp", text: "Đường Tân Hiệp" },
              { value: "Đường ĐT746", text: "Đường ĐT746" },
              { value: "Đường 30/4", text: "Đường 30/4" },
              { value: "Đường Thống Nhất", text: "Đường Thống Nhất" },
              { value: "Đường Tân Uyên", text: "Đường Tân Uyên" },
              { value: "Đường Lê Duẩn", text: "Đường Lê Duẩn" },
            ],
          },
        ],
      },
    ],
    DongNai: [
      {
        value: "Biên Hòa",
        text: "Biên Hòa",
        wards: [
          {
            value: "Phường Tân Hiệp",
            text: "Phường Tân Hiệp",
            streets: [
              { value: "Đường Tân Hiệp", text: "Đường Tân Hiệp" },
              { value: "Đường Nguyễn Ái Quốc", text: "Đường Nguyễn Ái Quốc" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Đồng Khởi", text: "Đường Đồng Khởi" },
              { value: "Đường Võ Thị Sáu", text: "Đường Võ Thị Sáu" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
            ],
          },
          {
            value: "Phường Quyết Thắng",
            text: "Phường Quyết Thắng",
            streets: [
              { value: "Đường Quyết Thắng", text: "Đường Quyết Thắng" },
              { value: "Đường Nguyễn Ái Quốc", text: "Đường Nguyễn Ái Quốc" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Đồng Khởi", text: "Đường Đồng Khởi" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
            ],
          },
          {
            value: "Phường Hóa An",
            text: "Phường Hóa An",
            streets: [
              { value: "Đường Hóa An", text: "Đường Hóa An" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Đồng Khởi", text: "Đường Đồng Khởi" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Nguyễn Ái Quốc", text: "Đường Nguyễn Ái Quốc" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
            ],
          },
          {
            value: "Phường Long Bình",
            text: "Phường Long Bình",
            streets: [
              { value: "Đường Long Bình", text: "Đường Long Bình" },
              { value: "Đường Nguyễn Ái Quốc", text: "Đường Nguyễn Ái Quốc" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Đồng Khởi", text: "Đường Đồng Khởi" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
            ],
          },
          {
            value: "Phường Tam Hiệp",
            text: "Phường Tam Hiệp",
            streets: [
              { value: "Đường Tam Hiệp", text: "Đường Tam Hiệp" },
              { value: "Đường Nguyễn Ái Quốc", text: "Đường Nguyễn Ái Quốc" },
              { value: "Đường Đồng Khởi", text: "Đường Đồng Khởi" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
            ],
          },
          {
            value: "Phường Quyết Thắng 2",
            text: "Phường Quyết Thắng 2",
            streets: [
              { value: "Đường Quyết Thắng", text: "Đường Quyết Thắng" },
              { value: "Đường Nguyễn Ái Quốc", text: "Đường Nguyễn Ái Quốc" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Đồng Khởi", text: "Đường Đồng Khởi" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
            ],
          },
        ],
      },
      {
        value: "Cẩm Mỹ",
        text: "Cẩm Mỹ",
        wards: [
          {
            value: "Xã Thanh Bình",
            text: "Xã Thanh Bình",
            streets: [
              { value: "Đường Thanh Bình", text: "Đường Thanh Bình" },
              { value: "Đường Cẩm Mỹ", text: "Đường Cẩm Mỹ" },
              { value: "Đường Đồng Khởi", text: "Đường Đồng Khởi" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
            ],
          },
          {
            value: "Xã Cẩm Tân",
            text: "Xã Cẩm Tân",
            streets: [
              { value: "Đường Cẩm Tân", text: "Đường Cẩm Tân" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Nguyễn Ái Quốc", text: "Đường Nguyễn Ái Quốc" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
            ],
          },
          {
            value: "Xã Bảo Vệ",
            text: "Xã Bảo Vệ",
            streets: [
              { value: "Đường Bảo Vệ", text: "Đường Bảo Vệ" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Nguyễn Ái Quốc", text: "Đường Nguyễn Ái Quốc" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
            ],
          },
          {
            value: "Xã Cẩm Lộc",
            text: "Xã Cẩm Lộc",
            streets: [
              { value: "Đường Cẩm Lộc", text: "Đường Cẩm Lộc" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Nguyễn Ái Quốc", text: "Đường Nguyễn Ái Quốc" },
            ],
          },
          {
            value: "Xã Sông Ray",
            text: "Xã Sông Ray",
            streets: [
              { value: "Đường Sông Ray", text: "Đường Sông Ray" },
              { value: "Đường Cẩm Mỹ", text: "Đường Cẩm Mỹ" },
              { value: "Đường Đồng Khởi", text: "Đường Đồng Khởi" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
            ],
          },
          {
            value: "Xã Sông Thao",
            text: "Xã Sông Thao",
            streets: [
              { value: "Đường Sông Thao", text: "Đường Sông Thao" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Nguyễn Ái Quốc", text: "Đường Nguyễn Ái Quốc" },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
            ],
          },
          {
            value: "Xã Bàu Sen",
            text: "Xã Bàu Sen",
            streets: [
              { value: "Đường Bàu Sen", text: "Đường Bàu Sen" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Nguyễn Ái Quốc", text: "Đường Nguyễn Ái Quốc" },
            ],
          },
          {
            value: "Xã Gia Tân",
            text: "Xã Gia Tân",
            streets: [
              { value: "Đường Gia Tân", text: "Đường Gia Tân" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
              { value: "Đường Nguyễn Ái Quốc", text: "Đường Nguyễn Ái Quốc" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
            ],
          },
        ],
      },
      {
        value: "Định Quán",
        text: "Định Quán",
        wards: [
          {
            value: "Xã Phú Vinh",
            text: "Xã Phú Vinh",
            streets: [
              { value: "Đường Phú Vinh", text: "Đường Phú Vinh" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
            ],
          },
          {
            value: "Xã Ngọc Định",
            text: "Xã Ngọc Định",
            streets: [
              { value: "Đường Ngọc Định", text: "Đường Ngọc Định" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
            ],
          },
          {
            value: "Xã Định An",
            text: "Xã Định An",
            streets: [
              { value: "Đường Định An", text: "Đường Định An" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
            ],
          },
          {
            value: "Xã Phú Cường",
            text: "Xã Phú Cường",
            streets: [
              { value: "Đường Phú Cường", text: "Đường Phú Cường" },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
            ],
          },
          {
            value: "Xã La Ngà",
            text: "Xã La Ngà",
            streets: [
              { value: "Đường La Ngà", text: "Đường La Ngà" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
            ],
          },
          {
            value: "Thị trấn Định Quán",
            text: "Thị trấn Định Quán",
            streets: [
              { value: "Đường Định Quán", text: "Đường Định Quán" },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
            ],
          },
          {
            value: "Xã Ngọc Lâm",
            text: "Xã Ngọc Lâm",
            streets: [
              { value: "Đường Ngọc Lâm", text: "Đường Ngọc Lâm" },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
            ],
          },
          {
            value: "Xã Tân Cảnh",
            text: "Xã Tân Cảnh",
            streets: [
              { value: "Đường Tân Cảnh", text: "Đường Tân Cảnh" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
            ],
          },
        ],
      },
      {
        value: "Long Khánh",
        text: "Long Khánh",
        wards: [
          {
            value: "Phường Bảo Vinh",
            text: "Phường Bảo Vinh",
            streets: [
              { value: "Đường Bảo Vinh", text: "Đường Bảo Vinh" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
            ],
          },
          {
            value: "Phường Bảo Quang",
            text: "Phường Bảo Quang",
            streets: [
              { value: "Đường Bảo Quang", text: "Đường Bảo Quang" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
            ],
          },
          {
            value: "Phường Long Khánh",
            text: "Phường Long Khánh",
            streets: [
              { value: "Đường Long Khánh", text: "Đường Long Khánh" },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
            ],
          },
          {
            value: "SuốiNhum",
            text: "Suối Nhum",
            streets: [
              { value: "Đường Suối Nhum", text: "Đường Suối Nhum" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
            ],
          },
          {
            value: "Phường Long Phước",
            text: "Phường Long Phước",
            streets: [
              { value: "Đường Long Phước", text: "Đường Long Phước" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
            ],
          },
          {
            value: "Phường Bảo Lộc",
            text: "Phường Bảo Lộc",
            streets: [
              { value: "Đường Bảo Lộc", text: "Đường Bảo Lộc" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
            ],
          },
          {
            value: "BếnCát",
            text: "Phường Bến Cát",
            streets: [
              { value: "Đường Bến Cát", text: "Đường Bến Cát" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
            ],
          },
          {
            value: "TânHương",
            text: "Phường Tân Hương",
            streets: [
              { value: "Đường Tân Hương", text: "Đường Tân Hương" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
            ],
          },
        ],
      },
      {
        value: "Long Thành",
        text: "Long Thành",
        wards: [
          {
            value: "Xã An Phước",
            text: "Xã An Phước",
            streets: [
              { value: "Đường An Phước", text: "Đường An Phước" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Quốc Lộ 51", text: "Đường Quốc Lộ 51" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
            ],
          },
          {
            value: "Xã Bình An",
            text: "Xã Bình An",
            streets: [
              { value: "Đường Bình An", text: "Đường Bình An" },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
              { value: "Đường Võ Nguyên Giáp", text: "Đường Võ Nguyên Giáp" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Lê Văn Tám", text: "Đường Lê Văn Tám" },
              {
                value: "Đường Nguyễn Thiện Thuật",
                text: "Đường Nguyễn Thiện Thuật",
              },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Đinh Bộ Lĩnh", text: "Đường Đinh Bộ Lĩnh" },
            ],
          },
          {
            value: "Xã Long Phước",
            text: "Xã Long Phước",
            streets: [
              { value: "Đường Long Phước", text: "Đường Long Phước" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường Phan Bội Châu", text: "Đường Phan Bội Châu" },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường Quốc Lộ 51", text: "Đường Quốc Lộ 51" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Dương Đình Nghệ", text: "Đường Dương Đình Nghệ" },
            ],
          },
          {
            value: "Suối Tranh",
            text: "Xã Suối Tranh",
            streets: [
              { value: "Đường Suối Tranh", text: "Đường Suối Tranh" },
              { value: "Đường Quốc Lộ 51", text: "Đường Quốc Lộ 51" },
              { value: "Đường Nguyễn Văn Cừ", text: "Đường Nguyễn Văn Cừ" },
              { value: "Đường Lê Văn Tám", text: "Đường Lê Văn Tám" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
            ],
          },
          {
            value: "Xã Phước Thiện",
            text: "Xã Phước Thiện",
            streets: [
              { value: "Đường Phước Thiện", text: "Đường Phước Thiện" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
              { value: "Đường Lê Quang Đạo", text: "Đường Lê Quang Đạo" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
              { value: "Đường Quốc Lộ 51", text: "Đường Quốc Lộ 51" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
            ],
          },
          {
            value: "Xã Long Tân",
            text: "Xã Long Tân",
            streets: [
              { value: "Đường Long Tân", text: "Đường Long Tân" },
              {
                value: "Đường Nguyễn Thiện Thuật",
                text: "Đường Nguyễn Thiện Thuật",
              },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Quốc Lộ 51", text: "Đường Quốc Lộ 51" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Lê Quang Đạo", text: "Đường Lê Quang Đạo" },
            ],
          },
          {
            value: "Xã An Phong",
            text: "Xã An Phong",
            streets: [
              { value: "Đường An Phong", text: "Đường An Phong" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Quốc Lộ 51", text: "Đường Quốc Lộ 51" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
            ],
          },
          {
            value: "Xã Tam An",
            text: "Xã Tam An",
            streets: [
              { value: "Đường Tam An", text: "Đường Tam An" },
              { value: "Đường Quốc Lộ 51", text: "Đường Quốc Lộ 51" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Hùng Vương", text: "Đường Hùng Vương" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
            ],
          },
        ],
      },
      {
        value: "Nhơn Trạch",
        text: "Nhơn Trạch",
        wards: [
          {
            value: "Xã Phước An",
            text: "Xã Phước An",
            streets: [
              { value: "Đường Phước An", text: "Đường Phước An" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Quốc Lộ 51", text: "Đường Quốc Lộ 51" },
              { value: "Đường Dương Đình Nghệ", text: "Đường Dương Đình Nghệ" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
            ],
          },
          {
            value: "Xã Vĩnh Thanh",
            text: "Xã Vĩnh Thanh",
            streets: [
              { value: "Đường Vĩnh Thanh", text: "Đường Vĩnh Thanh" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Lê Văn Tám", text: "Đường Lê Văn Tám" },
              { value: "Đường Quốc Lộ 51", text: "Đường Quốc Lộ 51" },
              {
                value: "Đường Nguyễn Thiện Thuật",
                text: "Đường Nguyễn Thiện Thuật",
              },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
              { value: "Đường Phan Bội Châu", text: "Đường Phan Bội Châu" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
            ],
          },
          {
            value: "Xã Nhơn Phú",
            text: "Xã Nhơn Phú",
            streets: [
              { value: "Đường Nhơn Phú", text: "Đường Nhơn Phú" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Lê Quang Đạo", text: "Đường Lê Quang Đạo" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
            ],
          },
          {
            value: "Xã Long Thượng",
            text: "Xã Long Thượng",
            streets: [
              { value: "Đường Long Thượng", text: "Đường Long Thượng" },
              {
                value: "Đường Nguyễn Thiện Thuật",
                text: "Đường Nguyễn Thiện Thuật",
              },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Quốc Lộ 51", text: "Đường Quốc Lộ 51" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
            ],
          },
          {
            value: "Xã Tân An",
            text: "Xã Tân An",
            streets: [
              { value: "Đường Tân An", text: "Đường Tân An" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Quốc Lộ 51", text: "Đường Quốc Lộ 51" },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
              { value: "Đường Lê Quang Đạo", text: "Đường Lê Quang Đạo" },
            ],
          },
          {
            value: "Xã Thị Diệm",
            text: "Xã Thị Diệm",
            streets: [
              { value: "Đường Thị Diệm", text: "Đường Thị Diệm" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
              { value: "Đường Phan Bội Châu", text: "Đường Phan Bội Châu" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Quốc Lộ 51", text: "Đường Quốc Lộ 51" },
              {
                value: "Đường Nguyễn Thiện Thuật",
                text: "Đường Nguyễn Thiện Thuật",
              },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
            ],
          },
          {
            value: "Xã Hiếu Liêm",
            text: "Xã Hiếu Liêm",
            streets: [
              { value: "Đường Hiếu Liêm", text: "Đường Hiếu Liêm" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Quốc Lộ 51", text: "Đường Quốc Lộ 51" },
              {
                value: "Đường Nguyễn Thiện Thuật",
                text: "Đường Nguyễn Thiện Thuật",
              },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường Lê Quang Đạo", text: "Đường Lê Quang Đạo" },
              {
                value: "Đường Cách Mạng Tháng 8",
                text: "Đường Cách Mạng Tháng 8",
              },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
            ],
          },
          {
            value: "Xã Bình Tuấn",
            text: "Xã Bình Tuấn",
            streets: [
              { value: "Đường Bình Tuấn", text: "Đường Bình Tuấn" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường Phan Bội Châu", text: "Đường Phan Bội Châu" },
              { value: "Đường Quốc Lộ 51", text: "Đường Quốc Lộ 51" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              {
                value: "Đường Nguyễn Thiện Thuật",
                text: "Đường Nguyễn Thiện Thuật",
              },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
            ],
          },
        ],
      },
      {
        value: "Tân Phú",
        text: "Tân Phú",
        wards: [
          {
            value: "Xã Tân Phong",
            text: "Xã Tân Phong",
            streets: [
              { value: "Đường Tân Phong", text: "Đường Tân Phong" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Quốc Lộ 20", text: "Đường Quốc Lộ 20" },
              { value: "Đường Dương Đình Nghệ", text: "Đường Dương Đình Nghệ" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
            ],
          },
          {
            value: "Xã Tân Hiếu",
            text: "Xã Tân Hiếu",
            streets: [
              { value: "Đường Tân Hiếu", text: "Đường Tân Hiếu" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
              {
                value: "Đường Cách Mạng Tháng Tám",
                text: "Đường Cách Mạng Tháng Tám",
              },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Quốc Lộ 20", text: "Đường Quốc Lộ 20" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
            ],
          },
          {
            value: "Xã Tân Sơn",
            text: "Xã Tân Sơn",
            streets: [
              { value: "Đường Tân Sơn", text: "Đường Tân Sơn" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Phan Bội Châu", text: "Đường Phan Bội Châu" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Quốc Lộ 20", text: "Đường Quốc Lộ 20" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
            ],
          },
          {
            value: "Xã Tây Sơn",
            text: "Xã Tây Sơn",
            streets: [
              { value: "Đường Tây Sơn", text: "Đường Tây Sơn" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường Quốc Lộ 20", text: "Đường Quốc Lộ 20" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
              {
                value: "Đường Nguyễn Thiện Thuật",
                text: "Đường Nguyễn Thiện Thuật",
              },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
            ],
          },
          {
            value: "Xã Phong Hòa",
            text: "Xã Phong Hòa",
            streets: [
              { value: "Đường Phong Hòa", text: "Đường Phong Hòa" },
              {
                value: "Đường Nguyễn Thị Minh Khai",
                text: "Đường Nguyễn Thị Minh Khai",
              },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Quốc Lộ 20", text: "Đường Quốc Lộ 20" },
              { value: "Đường Lê Quang Đạo", text: "Đường Lê Quang Đạo" },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
            ],
          },
          {
            value: "Xã Phước Tân",
            text: "Xã Phước Tân",
            streets: [
              { value: "Đường Phước Tân", text: "Đường Phước Tân" },
              { value: "Đường Trần Quang Khải", text: "Đường Trần Quang Khải" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
              { value: "Đường Quốc Lộ 20", text: "Đường Quốc Lộ 20" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
              {
                value: "Đường Cách Mạng Tháng Tám",
                text: "Đường Cách Mạng Tháng Tám",
              },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
            ],
          },
          {
            value: "Xã Cẩm Mỹ",
            text: "Xã Cẩm Mỹ",
            streets: [
              { value: "Đường Cẩm Mỹ", text: "Đường Cẩm Mỹ" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường Quốc Lộ 20", text: "Đường Quốc Lộ 20" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
              { value: "Đường Lý Thái Tổ", text: "Đường Lý Thái Tổ" },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
            ],
          },
          {
            value: "Xã Đông Tây",
            text: "Xã Đông Tây",
            streets: [
              { value: "Đường Đông Tây", text: "Đường Đông Tây" },
              { value: "Đường Nguyễn Văn Linh", text: "Đường Nguyễn Văn Linh" },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường Quốc Lộ 20", text: "Đường Quốc Lộ 20" },
              { value: "Đường Phan Bội Châu", text: "Đường Phan Bội Châu" },
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
            ],
          },
        ],
      },
      {
        value: "Thống Nhất",
        text: "Thống Nhất",
        wards: [
          {
            value: "Xã Tân Hiệp",
            text: "Xã Tân Hiệp",
            streets: [
              { value: "Đường Lê Lợi", text: "Đường Lê Lợi" },
              { value: "Đường Nguyễn Trãi", text: "Đường Nguyễn Trãi" },
              { value: "Đường Trần Hưng Đạo", text: "Đường Trần Hưng Đạo" },
              { value: "Đường Hai Bà Trưng", text: "Đường Hai Bà Trưng" },
              { value: "Đường Phan Chu Trinh", text: "Đường Phan Chu Trinh" },
              { value: "Đường Bà Triệu", text: "Đường Bà Triệu" },
              { value: "Đường Nguyễn Huệ", text: "Đường Nguyễn Huệ" },
              { value: "Đường Quang Trung", text: "Đường Quang Trung" },
            ],
          },
          {
            value: "Xã Bình Hòa",
            text: "Xã Bình Hòa",
            streets: [
              { value: "Đường Trần Phú", text: "Đường Trần Phú" },
              { value: "Đường Lê Thánh Tông", text: "Đường Lê Thánh Tông" },
              { value: "Đường Nguyễn Du", text: "Đường Nguyễn Du" },
              { value: "Đường Điện Biên Phủ", text: "Đường Điện Biên Phủ" },
              { value: "Đường Phan Đình Phùng", text: "Đường Phan Đình Phùng" },
              { value: "Đường Ngô Quyền", text: "Đường Ngô Quyền" },
              { value: "Đường Võ Thị Sáu", text: "Đường Võ Thị Sáu" },
              { value: "Đường Hoàng Văn Thụ", text: "Đường Hoàng Văn Thụ" },
            ],
          },
          {
            value: "Xã Tân Biên",
            text: "Xã Tân Biên",
            streets: [
              { value: "Đường Trường Chinh", text: "Đường Trường Chinh" },
              { value: "Đường Phan Văn Trị", text: "Đường Phan Văn Trị" },
              { value: "Đường Lý Thường Kiệt", text: "Đường Lý Thường Kiệt" },
              { value: "Đường Nguyễn Thái Học", text: "Đường Nguyễn Thái Học" },
              { value: "Đường Tô Hiệu", text: "Đường Tô Hiệu" },
              { value: "Đường Tôn Đức Thắng", text: "Đường Tôn Đức Thắng" },
              { value: "Đường Lê Hồng Phong", text: "Đường Lê Hồng Phong" },
              { value: "Đường Mạc Đĩnh Chi", text: "Đường Mạc Đĩnh Chi" },
            ],
          },
          {
            value: "Xã Xuân Lộc",
            text: "Xã Xuân Lộc",
            streets: [
              { value: "Đường Trưng Trắc", text: "Đường Trưng Trắc" },
              { value: "Đường Trưng Nhị", text: "Đường Trưng Nhị" },
              { value: "Đường Hoàng Hoa Thám", text: "Đường Hoàng Hoa Thám" },
              { value: "Đường Hồng Bàng", text: "Đường Hồng Bàng" },
              { value: "Đường Phan Văn Hớn", text: "Đường Phan Văn Hớn" },
              { value: "Đường Nguyễn An Ninh", text: "Đường Nguyễn An Ninh" },
              { value: "Đường Trần Quốc Toản", text: "Đường Trần Quốc Toản" },
              { value: "Đường Lê Quý Đôn", text: "Đường Lê Quý Đôn" },
            ],
          },
          {
            value: "Xã Hoa Sơn",
            text: "Xã Hoa Sơn",
            streets: [
              { value: "Đường Võ Văn Kiệt", text: "Đường Võ Văn Kiệt" },
              { value: "Đường Nguyễn Văn Cừ", text: "Đường Nguyễn Văn Cừ" },
              { value: "Đường Phan Ngọc Hiển", text: "Đường Phan Ngọc Hiển" },
              { value: "Đường Ngô Gia Tự", text: "Đường Ngô Gia Tự" },
              { value: "Đường Trần Nguyên Hãn", text: "Đường Trần Nguyên Hãn" },
              { value: "Đường Lê Đức Thọ", text: "Đường Lê Đức Thọ" },
              {
                value: "Đường Nguyễn Đình Chiểu",
                text: "Đường Nguyễn Đình Chiểu",
              },
              { value: "Đường Lê Văn Sỹ", text: "Đường Lê Văn Sỹ" },
            ],
          },
          {
            value: "Xã Tân Hải",
            text: "Xã Tân Hải",
            streets: [
              { value: "Đường Lê Văn Liệt", text: "Đường Lê Văn Liệt" },
              { value: "Đường Trần Văn Giàu", text: "Đường Trần Văn Giàu" },
              { value: "Đường Võ Văn Tần", text: "Đường Võ Văn Tần" },
              { value: "Đường Huỳnh Tấn Phát", text: "Đường Huỳnh Tấn Phát" },
              { value: "Đường Lê Trọng Tấn", text: "Đường Lê Trọng Tấn" },
              { value: "Đường Nguyễn Kiệm", text: "Đường Nguyễn Kiệm" },
              { value: "Đường Đinh Tiên Hoàng", text: "Đường Đinh Tiên Hoàng" },
              { value: "Đường Nguyễn Công Trứ", text: "Đường Nguyễn Công Trứ" },
            ],
          },
          {
            value: "Xã Đông Tâm",
            text: "Xã Đông Tâm",
            streets: [
              { value: "Đường Hoàng Minh Giám", text: "Đường Hoàng Minh Giám" },
              { value: "Đường Nguyễn Hữu Thọ", text: "Đường Nguyễn Hữu Thọ" },
              { value: "Đường Phạm Văn Đồng", text: "Đường Phạm Văn Đồng" },
              {
                value: "Đường Nguyễn Tất Thành",
                text: "Đường Nguyễn Tất Thành",
              },
              { value: "Đường Nguyễn Văn Trỗi", text: "Đường Nguyễn Văn Trỗi" },
              { value: "Đường Trần Văn Ơn", text: "Đường Trần Văn Ơn" },
              { value: "Đường Đoàn Văn Bơ", text: "Đường Đoàn Văn Bơ" },
              { value: "Đường Nguyễn Xiển", text: "Đường Nguyễn Xiển" },
            ],
          },
        ],
      },
    ],
  };

  const handleProvinceChange = (e) => {
    const selectedProvince = e.target.value;
    setSelectedProvince(selectedProvince);

    if (selectedProvince && districts[selectedProvince]) {
      setDistrictOptions(districts[selectedProvince]);
    } else {
      setDistrictOptions([]);
    }

    setSelectedDistrict("");
    setSelectedWard("");
    setSelectedWards([]);
  };

  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;
    setSelectedDistrict(selectedDistrict);
    if (selectedProvince && districts[selectedProvince]) {
      const selectedDistrictData = districts[selectedProvince].find(
        (district) => district.value === selectedDistrict
      );
      if (selectedDistrictData && selectedDistrictData.wards) {
        setSelectedWards(selectedDistrictData.wards);
        setSelectedWard("");
        setSelectedStreet("");
      } else {
        setSelectedWards([]);
      }
    } else {
      setSelectedWards([]);
    }
  };

  const handleWardChange = (e) => {
    setSelectedWard(e.target.value);
  };

  const handleStreetChange = (e) => {
    setSelectedStreet(e.target.value);
  };

  return (
    <main className="p-3 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">
        Cập nhật danh sách
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col gap-4 flex-1">
          <input
            type="text"
            placeholder="Tên danh sách"
            className="border p-3 rounded-lg"
            id="name"
            maxLength="62"
            minLength="10"
            required
            onChange={handleChange}
            value={formData.name}
          />
          <textarea
            type="text"
            placeholder="Mô tả"
            className="border p-3 rounded-lg"
            id="description"
            required
            onChange={handleChange}
            value={formData.description}
          />

          <div className="relative">
            <input
              type="text"
              placeholder="Nhập địa chỉ"
              className="border p-3 rounded-lg w-full"
              id="address"
              required
              onClick={handleAddressSelection} // Mở modal khi click vào ô Địa chỉ
              onChange={handleChange}
              value={formData.address}
              readOnly
            />

            {isAddressModalOpen && (
              <div className="absolute top-0 left-0 w-full bg-white z-10 p-4 shadow-md">
                <div>
                  <label>Tỉnh/Thành</label>
                  <select
                    value={selectedProvince}
                    onChange={(e) => {
                      handleProvinceChange(e);
                      setSelectedDistrict("");
                      setSelectedWard("");
                      setSelectedStreet("");
                      setSelectedDisplayAddress("");
                    }}
                    className="w-full p-2 border"
                  >
                    <option value="" disabled selected>
                      Chọn Tỉnh/Thành
                    </option>
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
                <div>
                  <label>Quận/Huyện</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => {
                      handleDistrictChange(e);
                      setSelectedWard("");
                      setSelectedStreet("");
                      setSelectedDisplayAddress("");
                    }}
                    className="w-full p-2 border"
                    disabled={!selectedProvince}
                  >
                    <option value="" disabled selected>
                      Chọn Quận/Huyện
                    </option>
                    {districtOptions.map((district) => (
                      <option key={district.value} value={district.value}>
                        {district.text}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Phường/Xã</label>
                  <select
                    value={selectedWard}
                    onChange={(e) => {
                      handleWardChange(e);
                      setSelectedStreet("");
                      setSelectedDisplayAddress("");
                    }}
                    className="w-full p-2 border"
                    disabled={!selectedDistrict}
                  >
                    <option value="" disabled selected>Chọn Phường/Xã</option>
                    {districts[selectedProvince]
                      ?.find((district) => district.value === selectedDistrict)
                      ?.wards?.map((ward) => (
                        <option key={ward.value} value={ward.value}>
                          {ward.text}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label>Đường/Phố</label>
                  <select
                    value={selectedStreet}
                    onChange={(e) => setSelectedStreet(e.target.value)}
                    className="w-full p-2 border"
                    disabled={!selectedWard}
                  >
                    <option value="" disabled selected>Chọn Đường/Phố</option>
                    {districts[selectedProvince]
                      ?.find((district) => district.value === selectedDistrict)
                      ?.wards?.find((ward) => ward.value === selectedWard)
                      ?.streets?.map((street) => (
                        <option key={street.value} value={street.value}>
                          {street.text}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label>Số nhà</label>
                  <input
                    type="text"
                    className="w-full p-2 border"
                    value={selectedDisplayAddress}
                    onChange={(e) => setSelectedDisplayAddress(e.target.value)}
                    placeholder="Số nhà"
                    disabled={!selectedStreet}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddressChange} // Cập nhật địa chỉ vào form khi chọn
                  className="bg-blue-500 text-white p-2 mt-4 w-full"
                >
                  Xác nhận
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal} // Đóng modal khi bấm "Đóng"
                  className="bg-red-500 text-white p-2 mt-2 w-full"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-6 flex-wrap">
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="sale"
                className="w-5"
                onChange={handleChange}
                checked={formData.type === "sale"}
              />
              <span>Bán</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="buy"
                className="w-5"
                onChange={handleChange}
                checked={formData.type === "buy"}
              />
              <span>Mua</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="parking"
                className="w-5"
                onChange={handleChange}
                checked={formData.parking}
              />
              <span>Chỗ đậu xe</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="furnished"
                className="w-5"
                onChange={handleChange}
                checked={formData.furnished}
              />
              <span>Nội thất</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="offer"
                className="w-5"
                onChange={handleChange}
                checked={formData.offer}
              />
              <span>Giảm giá</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="bedrooms"
                min="1"
                max="10"
                required
                className="p-3 border-gray-300 rounded-lg"
                onChange={handleChange}
                value={formData.bedrooms}
              />
              <p>Giường</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="bathrooms"
                min="1"
                max="10"
                required
                className="p-3 border-gray-300 rounded-lg"
                onChange={handleChange}
                value={formData.bathrooms}
              />
              <p>Phòng tắm</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                id="area"
                min="0"
                max="100000000"
                required
                className="p-3 border-gray-300 rounded-lg"
                onChange={handleChange}
                value={formData.area}
              />
              <p>Diện tích (m²)</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                id="regularPrice"
                min="50"
                max="100000000000"
                required
                className="p-3 border-gray-300 rounded-lg"
                onChange={handleChange}
                value={formData.regularPrice}
              />
              <div className="flex flex-col items-center">
                <p>Giá cả</p>
              </div>
            </div>
            {formData.offer && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="discountPrice"
                  min="0"
                  max="10000000000"
                  required
                  className="p-3 border-gray-300 rounded-lg"
                  onChange={handleChange}
                  value={formData.discountPrice}
                />
                <div className="flex flex-col items-center">
                  <p>Giá giảm</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col flex-1 gap-4">
          <p className="font-semibold ">
            Hình ảnh:
            <span className="font-normal text-gray-600 ml-2">
              Hình ảnh đầu tiên sẽ là ảnh bìa (tối đa 6 hình)
            </span>
          </p>
          <div className="flex gap-4">
            <input
              onChange={(e) => setFiles(e.target.files)}
              className="p-3 border border-gray-300 rounded w-full"
              type="file"
              id="images"
              accept="image/*"
              multiple
            />
            <button
              type="button"
              disabled={uploading}
              onClick={handleImageSubmit}
              className="p-3 text-green-700 border border-green-700 rounded uppercase hover:shadow-lg disabled:opacity-80"
            >
              {uploading ? "Uploading..." : "Cập nhật"}
            </button>
          </div>
          <p className="text-red-700 text-sm">
            {imageUploadError && imageUploadError}
          </p>
          {formData.imageUrls.length > 0 &&
            formData.imageUrls.map((url, index) => (
              <div
                key={url}
                className="flex justify-between p-3 border items-center"
              >
                <img
                  src={url}
                  alt="listing image"
                  className="w-20 h-20 object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="p-3 text-red-700 rounded-lg uppercase hover:opacity-75"
                >
                  Xoá
                </button>
              </div>
            ))}
          <button
            disabled={loading || uploading}
            className="p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
          >
            {loading ? "Updating..." : "Cập nhật danh sách"}
          </button>
          {error && <p className="text-red-700 text-sm">{error}</p>}
        </div>
      </form>
    </main>
  );
}
