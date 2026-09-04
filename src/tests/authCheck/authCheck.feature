@authCheck @session
Feature: Session Storage Authentication Check
  As an automated testing framework
  I want to verify that storageState session credentials are valid
  So that downstream tests run without re-authenticating

  @TC_3001
  Scenario: Verify storageState cached session token validity
    Given the storageState session is active for user "StandardUser"
    When the user navigates to the authenticated home page
    Then the user session should be confirmed valid
