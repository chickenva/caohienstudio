import React from "react";
import { useParams } from "react-router-dom";
import { Row, Col, Image } from "antd";

const FONT_SERIF = '"Playfair Display", serif';

const AlbumDetail = () => {
  const { slug } = useParams();

  // Dữ liệu mẫu cho các cặp đôi
  const albumData = {
    "minh-thao": {
      title: "Minh & Thảo",
      location: "Da Lat, Viet Nam",
      description:
        "Một buổi chiều hoàng hôn rực rỡ tại đồi thông, nơi tình yêu hòa quyện cùng làn sương mờ.",
      images: [
        "https://images.unsplash.com/photo-1519741497674-611481863552",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc",
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a",
        "https://images.unsplash.com/photo-1494774157365-9e04c6720e47",
        "https://images.unsplash.com/photo-1522673607200-1648832cee98",
        "https://images.unsplash.com/photo-1510076857177-7470076d4098",
      ],
    },
    "hoang-linh": {
      title: "Hoàng & Linh",
      location: "Phu Quoc Island",
      description:
        "Tiếng sóng vỗ rì rào và bờ cát trắng trải dài là chứng nhân cho lời thề nguyện của họ.",
      images: [
        "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8",
        "https://images.unsplash.com/photo-1537633552985-df8429e8048b",
        "https://images.unsplash.com/photo-1520854221256-17451cc331bf",
        "https://images.unsplash.com/photo-1507504031003-b417219a0fde",
      ],
    },
  };

  const currentAlbum = albumData[slug] || albumData["minh-thao"];

  return (
    <div style={{ background: "#fff", paddingBottom: "100px" }}>
      {/* Hero Header của Album */}
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <p
          style={{
            letterSpacing: "3px",
            fontSize: "12px",
            color: "#999",
            textTransform: "uppercase",
            marginBottom: "15px",
          }}
        >
          {currentAlbum.location}
        </p>
        <h1
          style={{
            fontFamily: FONT_SERIF,
            fontSize: "60px",
            fontWeight: "normal",
            margin: 0,
          }}
        >
          {currentAlbum.title}
        </h1>
        <div
          style={{
            maxWidth: "600px",
            margin: "30px auto",
            fontSize: "14px",
            color: "#666",
            lineHeight: "1.8",
            fontStyle: "italic",
          }}
        >
          "{currentAlbum.description}"
        </div>
      </div>

      {/* Gallery Grid phong cách Editorial */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        <Image.PreviewGroup>
          <Row gutter={[16, 16]}>
            {currentAlbum.images.map((img, index) => (
              <Col
                key={index}
                xs={24}
                md={index % 3 === 0 ? 24 : 12} // Ảnh đầu tiên to ngang, các ảnh sau chia đôi
                style={{ overflow: "hidden" }}
              >
                <div className="img-hover-container">
                  <Image
                    src={`${img}?auto=format&fit=crop&w=1200&q=80`}
                    style={{
                      width: "100%",
                      height: index % 3 === 0 ? "600px" : "450px",
                      objectFit: "cover",
                      transition: "transform 0.5s ease",
                    }}
                    placeholder={true}
                  />
                </div>
              </Col>
            ))}
          </Row>
        </Image.PreviewGroup>
      </div>

      <style>{`
        .img-hover-container { cursor: zoom-in; position: relative; }
        .ant-image:hover { transform: scale(1.02); }
      `}</style>
    </div>
  );
};

export default AlbumDetail;
