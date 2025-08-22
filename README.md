# DefenDDoS-Cloud 🛡️

> **Status: 🚧 In Development Phase**

A comprehensive cloud-based DoS/DDoS detection and prevention system built with modern technologies for real-time network traffic analysis and threat mitigation.

## 🎯 Project Overview

DefenDDoS-Cloud is an intelligent security solution designed to:
- **Detect** DoS/DDoS attacks in real-time
- **Analyze** network traffic patterns
- **Store** time-series data for forensic analysis
- **Provide** REST APIs for integration
- **Scale** horizontally in cloud environments

## 🏗️ Architecture

```
┌─────────────────┐    HTTP POST     ┌─────────────────┐    InfluxDB     ┌─────────────────┐
│   Client/GUI    │ ───────────────> │  Spring Boot    │ ─────────────> │    InfluxDB     │
│   (Frontend)    │                  │   Backend API   │                 │   Time-Series   │
└─────────────────┘                  └─────────────────┘                 │    Database     │
                                                                          └─────────────────┘
```

## 🚀 Features (In Development)

### ✅ **Completed Features:**
- [x] REST API for traffic data ingestion
- [x] InfluxDB integration for time-series storage
- [x] Spring Boot backend architecture
- [x] Docker containerization for database
- [x] Data model for network traffic
- [x] Automated timestamping

### 🔄 **In Progress:**
- [ ] Real-time traffic analysis algorithms
- [ ] DoS/DDoS detection engine
- [ ] Web dashboard frontend
- [ ] Alert system and notifications
- [ ] Authentication and authorization

### 📋 **Planned Features:**
- [ ] Machine learning-based threat detection
- [ ] Multi-tenant support
- [ ] Cloud deployment (AWS/GCP/Azure)
- [ ] Grafana integration for visualization
- [ ] Rate limiting and traffic shaping
- [ ] Comprehensive logging and monitoring

## 🛠️ Technology Stack

### **Backend:**
- **Java 21** - Modern JVM platform
- **Spring Boot 3.5.5** - Enterprise application framework
- **Spring Web** - REST API development
- **Maven** - Dependency management and build automation

### **Database:**
- **InfluxDB 2.7** - Time-series database for traffic data
- **Docker** - Containerized database deployment

### **Development Tools:**
- **Lombok** - Reducing boilerplate code
- **VS Code** - Development environment
- **Git** - Version control

## 📁 Project Structure

```
backend-service/
├── src/main/java/com/defenddos/backend_service/
│   ├── BackendServiceApplication.java      # 🚀 Main Application
│   ├── config/
│   │   └── InfluxDBConfig.java            # 🔧 Database Configuration
│   ├── controller/
│   │   └── TrafficController.java         # 🌐 REST API Endpoints
│   ├── model/
│   │   └── TrafficPoint.java              # 📊 Data Models
│   └── service/
│       └── TrafficService.java            # 💼 Business Logic
├── src/main/resources/
│   └── application.properties             # ⚙️ App Configuration
├── requests.http                          # 🧪 API Testing
└── pom.xml                               # 📦 Dependencies
```

## 🚀 Quick Start

### **Prerequisites:**
- Java 21+
- Docker
- Maven (or use included wrapper)

### **1. Clone Repository:**
```bash
git clone https://github.com/ByteAcumen/DefenDDoS-Cloud.git
cd DefenDDoS-Cloud
```

### **2. Start InfluxDB:**
```bash
docker run -d -p 8086:8086 --name influxdb-defenddos \
  -e DOCKER_INFLUXDB_INIT_MODE=setup \
  -e DOCKER_INFLUXDB_INIT_USERNAME=admin \
  -e DOCKER_INFLUXDB_INIT_PASSWORD=supersecretpassword \
  -e DOCKER_INFLUXDB_INIT_ORG=defenddos-org \
  -e DOCKER_INFLUXDB_INIT_BUCKET=ddos-bucket \
  -e DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=my-super-secret-token \
  influxdb:2.7
```

### **3. Start Backend:**
```bash
cd backend-service
./mvnw clean compile
./mvnw spring-boot:run
```

### **4. Test API:**
```bash
curl -X POST http://localhost:8080/api/v1/traffic/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "sourceIp": "192.168.1.100",
    "destinationIp": "10.20.30.40",
    "packetCount": 250,
    "byteCount": 128000
  }'
```

## 📖 API Documentation

### **Traffic Ingestion Endpoint**

**POST** `/api/v1/traffic/ingest`

**Request Body:**
```json
{
  "sourceIp": "string",
  "destinationIp": "string", 
  "packetCount": "number",
  "byteCount": "number",
  "timestamp": "ISO-8601 datetime (optional)"
}
```

**Response:**
```json
"Traffic data ingested successfully."
```

## 🐳 Docker Setup

### **InfluxDB Configuration:**
- **URL:** http://localhost:8086
- **Username:** admin
- **Password:** supersecretpassword
- **Organization:** defenddos-org
- **Bucket:** ddos-bucket
- **Token:** my-super-secret-token

## 🔧 Configuration

Update `application.properties` with your InfluxDB settings:

```properties
# InfluxDB Configuration
influx.url=http://localhost:8086
influx.token=your-influxdb-token
influx.org=your-organization
influx.bucket=your-bucket-name

# Server Configuration  
server.port=8080
```

## 🧪 Testing

### **Using VS Code REST Client:**
Open `requests.http` and click "Send Request"

### **Using curl:**
See Quick Start section above

### **Expected Output:**
- API Response: `200 OK`
- Console: `"Successfully wrote data point from IP: xxx.xxx.xxx.xxx"`
- InfluxDB: Data visible in Data Explorer

## 🤝 Contributing

This project is in active development. Contributions are welcome!

### **Development Workflow:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Repository:** https://github.com/ByteAcumen/DefenDDoS-Cloud
- **Issues:** https://github.com/ByteAcumen/DefenDDoS-Cloud/issues
- **InfluxDB Docs:** https://docs.influxdata.com/
- **Spring Boot Docs:** https://spring.io/projects/spring-boot

## 📞 Contact

For questions and support, please open an issue or contact the development team.

---

**⚠️ Note:** This project is currently in development phase. Production deployment is not recommended yet.
