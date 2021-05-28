# igc-analysis
This repository is build on the [IGC Analysis Repository](https://github.com/kettemann/igc-analysis) and aims to extend its features. 

# jsIGC
This repository is built upon the [IGCWebView Repository](https://github.com/alistairmgreen/IGCWebView), 
which is a free browser-based tool for viewing GPS tracks and barograph traces from gliding loggers using the IGC data format.

# IGC Analytics Goal
This repository aims to do a complete, dynamic analysis and documentation of an IGC file, 
including the detection of geometric shapes in the IGC graph.

The web app currently recognizes the following geometric shapes:
 * 90° curve (experimental)
 * 180° curve (experimental)
 * circle (experimental)
 
This application is currently under development and will include more geometric
shapes (eight, FAI triangle) and key figures in the future.

Note: this app requires a web-server to upload IGC files and fetch a default file.
You can configure this server in 'src/config.js'.

Known Problems:
 * When the application is running in the background, the cpu usage goes very low
    * This is intended by most browsers 
    * Not much can be done about it, except for informing the user about this

