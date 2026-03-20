from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String, create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./gridmind.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Ward(Base):
    __tablename__ = "wards"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    epi_score = Column(Float)
    solar_ghi = Column(Float)
    outage_hours = Column(Float)
    burden_pct = Column(Float)
    income_decile = Column(Integer)
    lat = Column(Float)
    lng = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class City(Base):
    __tablename__ = "cities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    state = Column(String)
    epi = Column(Float)
    outage = Column(Float)
    burden = Column(Float)
    reliability = Column(Float)
    grid_loss = Column(Float)
    renewable = Column(Float)
    tariff = Column(Float)

class Intervention(Base):
    __tablename__ = "interventions"
    id = Column(Integer, primary_key=True, index=True)
    rank = Column(Integer)
    name = Column(String)
    wards_covered = Column(String)
    households = Column(Integer)
    cost_lakh = Column(Float)
    hh_per_lakh = Column(Float)
    type = Column(String)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"DB connection check failed: {e}")
        return False

def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        print("DB tables created successfully")
        seed_db()
    except Exception as e:
        print(f"DB init error: {e}")

def seed_db():
    db = SessionLocal()
    try:
        if db.query(Ward).count() == 0:
            wards = [
                Ward(id=1,  name="Nayapalli",       epi_score=0.81, solar_ghi=5.8, outage_hours=7.2, burden_pct=14.3, income_decile=2, lat=20.2961, lng=85.8245),
                Ward(id=2,  name="Saheed Nagar",     epi_score=0.74, solar_ghi=5.5, outage_hours=6.1, burden_pct=12.8, income_decile=3, lat=20.2880, lng=85.8420),
                Ward(id=3,  name="Bomikhal",         epi_score=0.68, solar_ghi=5.2, outage_hours=5.5, burden_pct=11.2, income_decile=4, lat=20.2750, lng=85.8380),
                Ward(id=4,  name="Kharvel Nagar",    epi_score=0.44, solar_ghi=4.8, outage_hours=3.8, burden_pct=8.4,  income_decile=5, lat=20.2700, lng=85.8300),
                Ward(id=5,  name="Master Canteen",   epi_score=0.31, solar_ghi=4.5, outage_hours=2.1, burden_pct=6.2,  income_decile=6, lat=20.2650, lng=85.8350),
                Ward(id=6,  name="BJB Nagar",        epi_score=0.22, solar_ghi=4.3, outage_hours=1.4, burden_pct=4.8,  income_decile=7, lat=20.2600, lng=85.8400),
                Ward(id=7,  name="Jaydev Vihar",     epi_score=0.15, solar_ghi=4.1, outage_hours=0.9, burden_pct=3.2,  income_decile=8, lat=20.3050, lng=85.8180),
                Ward(id=8,  name="Patia",            epi_score=0.77, solar_ghi=5.9, outage_hours=6.8, burden_pct=13.9, income_decile=2, lat=20.3200, lng=85.8150),
                Ward(id=9,  name="Chandrasekharpur", epi_score=0.52, solar_ghi=5.0, outage_hours=4.2, burden_pct=9.1,  income_decile=5, lat=20.3100, lng=85.8100),
                Ward(id=10, name="Old Town",         epi_score=0.71, solar_ghi=5.6, outage_hours=5.9, burden_pct=12.1, income_decile=3, lat=20.2400, lng=85.8350),
            ]
            db.add_all(wards)
            db.commit()
            print("Wards seeded successfully")
        if db.query(City).count() == 0:
            cities = [
                City(name="Bhubaneswar",      state="Odisha",      epi=0.54, outage=4.8, burden=9.8,  reliability=0.58, grid_loss=8.2,  renewable=12, tariff=5.40),
                City(name="Kolkata",          state="West Bengal", epi=0.48, outage=3.9, burden=8.9,  reliability=0.64, grid_loss=10.1, renewable=8,  tariff=6.20),
                City(name="Patna",            state="Bihar",       epi=0.67, outage=6.1, burden=12.4, reliability=0.48, grid_loss=12.8, renewable=6,  tariff=4.90),
                City(name="Pune",             state="Maharashtra", epi=0.19, outage=1.2, burden=4.8,  reliability=0.88, grid_loss=5.2,  renewable=28, tariff=5.80),
                City(name="Surat",            state="Gujarat",     epi=0.17, outage=0.9, burden=4.2,  reliability=0.91, grid_loss=4.1,  renewable=32, tariff=4.50),
                City(name="National Optimal", state="Standard",    epi=0.12, outage=0.5, burden=3.5,  reliability=0.95, grid_loss=3.5,  renewable=40, tariff=4.20),
            ]
            db.add_all(cities)
            db.commit()
            print("Cities seeded successfully")
        if db.query(Intervention).count() == 0:
            interventions = [
                Intervention(rank=1, name="Rooftop Solar + BESS Cluster",  wards_covered="Aiginia/Nayapalli",   households=1240, cost_lakh=48,  hh_per_lakh=25.8, type="quick"),
                Intervention(rank=2, name="Community Solar Microgrid",      wards_covered="Patia/Old Town",      households=980,  cost_lakh=42,  hh_per_lakh=23.3, type="infra"),
                Intervention(rank=3, name="Smart Meter + Demand Response",  wards_covered="Saheed Nagar",        households=760,  cost_lakh=35,  hh_per_lakh=21.7, type="quick"),
                Intervention(rank=4, name="Grid Feeder Upgrade",            wards_covered="Bomikhal/Mancheswar", households=1100, cost_lakh=62,  hh_per_lakh=17.7, type="infra"),
                Intervention(rank=5, name="PM-KUSUM Subsidy Facilitation",  wards_covered="All Critical",        households=2400, cost_lakh=140, hh_per_lakh=17.1, type="policy"),
                Intervention(rank=6, name="LED Streetlight + DG Offset",    wards_covered="Rasulgarh",           households=540,  cost_lakh=32,  hh_per_lakh=16.9, type="quick"),
                Intervention(rank=7, name="Solar Pump + Agri Grid Relief",  wards_covered="Aiginia Outskirts",   households=380,  cost_lakh=26,  hh_per_lakh=14.6, type="infra"),
            ]
            db.add_all(interventions)
            db.commit()
            print("Interventions seeded successfully")
    except Exception as e:
        print(f"Seed error: {e}")
        db.rollback()
    finally:
        db.close()
