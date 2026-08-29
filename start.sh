#!/bin/bash
set -e

# Export OpenJDK and Maven PATH
export PATH="/opt/homebrew/opt/openjdk/bin:/opt/homebrew/bin:$PATH"
export JAVA_HOME="/opt/homebrew/opt/openjdk"

echo "=========================================================="
echo "📦 Starting APEX B2B Retail Order & Admin Management System"
echo "=========================================================="
echo "Java Version : $(java -version 2>&1 | head -n 1)"
echo "Maven Version: $(mvn -version 2>&1 | head -n 1)"
echo "Port         : 8080"
echo "Web Portal   : http://localhost:8080"
echo "H2 Console   : http://localhost:8080/h2-console"
echo "=========================================================="

mvn spring-boot:run
