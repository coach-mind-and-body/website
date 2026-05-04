import React from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  name?: string;
  type?: string;
  image?: string;
  url?: string;
  schema?: Record<string, any>;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  name = "Mind & Body Reset",
  type = "website",
  image = "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663371864914/eCTnvmnMgtoPSEVJ.png?Expires=1804045266&Signature=oGKs8o9KfO0~k2qX3u2CKMepWZZW5o3EcRXjopM2siYxvI3DzRbe3dcUbowLpIu2H2S~WROdd5qnqPu1oywo6EINglVG~bq-4VUunML82Pu-wL2PFdMzfzUxBXxCOi4MKkh37bMY94XSxCBDUVWV9oc-XM4kRXIy6-fnMHAl2ML~zYqJ5LVzLrvh1zv5m1PPoqCz-03Zaph6z9JoW5zFOLZTmpjEQ5xPPUA1Hp3aHLWwwxoWMjYB87sQ2S6STFeNPDq2-84uk1-2Le84If1Zz8yL7DMdBrCP6Z1kUBb30jbaoLRtqUmypXBAhUdDGyNNbe9bjQ2SyG-zdIHX7u0W8g__&Key-Pair-Id=K2HSFNDJXOU9YS",
  url = "https://mindandbodyresetcoach.com",
  schema,
}) => {
  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph tags for Facebook, LinkedIn, etc. */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={name} />
      {url && <meta property="og:url" content={url} />}
      {image && <meta property="og:image" content={image} />}
      
      {/* Twitter tags */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {/* JSON-LD Schema structured data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};
