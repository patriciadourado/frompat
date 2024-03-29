/**
 * SEO component that queries for data with
 *  Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import React from "react"
import PropTypes from "prop-types"
import { Helmet } from "react-helmet"
import { useStaticQuery, graphql } from "gatsby"

const SEO = ({ description, lang, meta, title, image, pathname }) => {
  const data = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
            social {
              twitter
            }
            siteUrl
          }
        }
        ogImageDefault: file(relativePath: {eq: "icon.png"}) { 
          childImageSharp {
            fixed(height: 260, width: 260) {
              src
            }
          }
        }
      }
    `
  )
  
  const { siteMetadata } = data.site;
  const metaDescription = description || siteMetadata.description;
  const defaultTitle = data.siteMetadata?.title;
  const canonical = pathname ? `https://www.patriciadourado.com${pathname}` : null;
  let ogImageUrl = image;
  let ttImageUrl = image;
  
  if(title!=="All posts | frompat "){
    const imageSrc = image;
    
    let origin = "";
    if (typeof window !== "undefined") {
      origin = window.location.origin;
    }
    ogImageUrl = origin + imageSrc;
    ttImageUrl = 'https://www.patriciadourado.com' + imageSrc;
  }
  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      title={title}
      titleTemplate={defaultTitle ? `%s | ${defaultTitle}` : null}
      link={
        canonical
          ? [
              {
                rel: "canonical",
                href: canonical,
              },
            ]
          : []
      }
      meta={[
        { name: `title`, content: metaDescription, },
        { name: `description`, content: metaDescription, },
        { name: `thumbnail`, content: ogImageUrl, },
        { itemProp: `name`, content: metaDescription, },
        { itemProp:`description`, content: metaDescription, },
        { itemProp: `image`, content: ogImageUrl, },
        { property: `og:title`, content: title, },
        { property: `og:description`, content: metaDescription, },
        { property: `og:type`, content: `website`, },
        { property: `og:url`, content: `https://www.patriciadourado.com/frompat`, },
        { property: `og:image`, content: ogImageUrl, },
        { property: `og:image:type`, content: `image/png`, },
        { property: `og:image:width`, content: `845`, },
        { property: `og:image:height`, content: `465`, },
        { property: `twitter:card`, content: `summary_large_image`, },
        { property: `twitter:creator`, content: siteMetadata?.social?.twitter || ``, },
        { property: `twitter:title`, content: title, },
        { property: `twitter:url`, content: `https://www.patriciadourado.com/frompat`, },
        { property: `twitter:image`, content: ttImageUrl, },
        { property: "twitter:image:alt", content: title, },
        { property: `twitter:description`, content: metaDescription,},
      ].concat(meta)}
    />
  )
}

SEO.defaultProps = {
  lang: `en`,
  meta: [],
  description: ``,
}

SEO.propTypes = {
  description: PropTypes.string,
  lang: PropTypes.string,
  meta: PropTypes.arrayOf(PropTypes.object),
  title: PropTypes.string.isRequired,
  image:PropTypes.string.isRequired,
  pathname: PropTypes.string,
}

export default SEO
