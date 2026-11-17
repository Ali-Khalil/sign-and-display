# Fonts for generated images

`Montserrat-Black.ttf` and `Michroma-Regular.ttf` are TrueType copies of the
site's two brand fonts (both SIL Open Font License; licence texts are in
`public/fonts/licenses/`). The image library that draws the social images at
build time cannot read WOFF2, so it uses these.

The Montserrat file is the Black (900) weight, renamed inside the file to
"Montserrat SignDisplay" so the image library matches it by exact name.
