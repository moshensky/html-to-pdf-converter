# Testing

## Setup

```bash
brew install graphicsmagick
brew install ghostscript
```

## Graphicsmagick

```bash
gm convert in.pdf -append out.png # append vertically
gm convert in.pdf +append out.png # append horizontally
```

## Version

(ins)| => gm -version
GraphicsMagick 1.3.27  Q16 http://www.GraphicsMagick.org/
Copyright (C) 2002-2017 GraphicsMagick Group.
Additional copyrights and licenses apply to this software.
See http://www.GraphicsMagick.org/www/Copyright.html for details.

Feature Support:
  Native Thread Safe       yes
  Large Files (> 32 bit)   yes
  Large Memory (> 32 bit)  yes
  BZIP                     yes
  DPS                      no
  FlashPix                 no
  FreeType                 yes
  Ghostscript (Library)    no
  JBIG                     no
  JPEG-2000                no
  JPEG                     yes
  Little CMS               no
  Loadable Modules         yes
  OpenMP                   no
  PNG                      yes
  TIFF                     yes
  TRIO                     no
  UMEM                     no
  WebP                     no
  WMF                      no
  X11                      no
  XML                      yes
  ZLIB                     yes

Host type: x86_64-apple-darwin17.3.0

Configured using the command:
  ./configure  '--prefix=/usr/local/Cellar/graphicsmagick/1.3.27' '--disable-dependency-tracking' '--enable-shared' '--disable-static' '--with-modules' '--without-lzma' '--disable-openmp' '--with-quantum-depth=16' '--disable-installed' '--without-gslib' '--with-gs-font-dir=/usr/local/share/ghostscript/fonts' '--without-x' '--without-lcms2' 'CC=clang' 'CXX=clang++'

Final Build Parameters:
  CC       = clang
  CFLAGS   = -g -O2 -Wall -D_THREAD_SAFE
  CPPFLAGS = -I/usr/local/opt/freetype/include/freetype2 -I/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX10.13.sdk/usr/include/libxml2
  CXX      = clang++
  CXXFLAGS = -D_THREAD_SAFE
  LDFLAGS  = -L/usr/local/opt/freetype/lib -L/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX10.13.sdk/usr/lib
  LIBS     = -lfreetype -lbz2 -lz -lltdl -lm -lpthread
